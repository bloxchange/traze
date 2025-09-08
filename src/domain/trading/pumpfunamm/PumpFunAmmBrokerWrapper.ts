import type { IBroker } from '../IBroker';
import type { IBuyParameters } from '../IBuyParameters';
import type { ISellParameters } from '../ISellParameters';
import type TradeEventInfo from '../../models/TradeEventInfo';
import { type PumpFunAmmConfig } from './PumpFunAmmBroker';
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
  type GetProgramAccountsResponse,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { globalEventEmitter } from '../../infrastructure/events/EventEmitter';
import {
  EVENTS,
  type BalanceChangeData,
} from '../../infrastructure/events/types';
import {
  PUMPFUN_AMM_PROGRAM_ID,
  WRAPPED_SOL_MINT,
} from '../../infrastructure/consts';
import { PoolAccount } from './PoolAccount';
import { getBalance } from '@/domain/rpc';
import { PumpAmmSdk } from '@pump-fun/pump-swap-sdk';
import type { PriorityFee } from '../pumpfun/types';
import * as borsh from '@coral-xyz/borsh';
import { liquidityPoolCache } from '../../infrastructure/liquidityPoolCache';

export class PumpFunAmmBrokerWrapper implements IBroker {
  private connection: Connection;
  private pumpAmmSdk: PumpAmmSdk;

  constructor(config: PumpFunAmmConfig) {
    this.connection = config.provider.connection;
    this.pumpAmmSdk = new PumpAmmSdk(this.connection);
  }

  // Instruction discriminators from IDL
  private static readonly BUY_DISCRIMINATOR = Buffer.from([
    102, 6, 61, 18, 1, 218, 235, 234,
  ]);

  private static readonly SELL_DISCRIMINATOR = Buffer.from([
    51, 230, 133, 164, 1, 127, 131, 173,
  ]);

  // Borsh schemas for instruction arguments
  private static readonly buyArgsSchema = borsh.struct([
    borsh.u64('baseAmountOut'),
    borsh.u64('maxQuoteAmountIn'),
  ]);

  private static readonly sellArgsSchema = borsh.struct([
    borsh.u64('baseAmountIn'),
    borsh.u64('minQuoteAmountOut'),
  ]);

  /**
   * Decodes the 4th instruction data to extract amount information
   * @param instructions Array of instructions from buyQuoteInput or sellBaseInput result
   * @returns Decoded amounts or null if decoding fails
   */
  private decodeInstructionAmounts(
    instructions: any[],
    isBuy: boolean
  ): {
    type: 'buy' | 'sell';
    baseAmount: bigint;
    quoteAmount: bigint;
  } | null {
    if (!instructions || instructions.length < 3) {
      return null;
    }

    const fourthInstruction = instructions[isBuy ? 3 : 1];
    if (!fourthInstruction?.data) {
      return null;
    }

    try {
      const instructionData = Buffer.from(fourthInstruction.data, 'base64');

      // Check if it's a buy instruction
      if (
        instructionData
          .subarray(0, 8)
          .equals(PumpFunAmmBrokerWrapper.BUY_DISCRIMINATOR)
      ) {
        const argsData = instructionData.subarray(8);

        const decoded = PumpFunAmmBrokerWrapper.buyArgsSchema.decode(argsData);

        return {
          type: 'buy',
          baseAmount: decoded.baseAmountOut,
          quoteAmount: decoded.maxQuoteAmountIn,
        };
      }

      // Check if it's a sell instruction
      if (
        instructionData
          .subarray(0, 8)
          .equals(PumpFunAmmBrokerWrapper.SELL_DISCRIMINATOR)
      ) {
        const argsData = instructionData.subarray(8);

        const decoded = PumpFunAmmBrokerWrapper.sellArgsSchema.decode(argsData);

        return {
          type: 'sell',
          baseAmount: decoded.baseAmountIn,
          quoteAmount: decoded.minQuoteAmountOut,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async dispatchBuyEvents(
    tokenMint: string,
    buyerPubKey: PublicKey,
    totalSolSpent: number,
    buyAmount: number
  ) {
    // Emit SOL balance change (negative as SOL is spent)
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
      {
        tokenMint: '',
        amount: -totalSolSpent,
        owner: buyerPubKey,
        source: 'swap',
      }
    );

    // Emit token balance change (positive as tokens are received)
    // Amount is in raw token units, formatting will be handled by the consumer
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
      {
        tokenMint: tokenMint,
        amount: buyAmount,
        owner: buyerPubKey,
        source: 'swap',
      }
    );
  }

  private async dispatchSellEvents(
    tokenMint: string,
    seller: PublicKey,
    sellTokenAmount: number,
    solReceived: number
  ) {
    // Emit token balance change (negative as tokens are sold)
    // Amount is in raw token units, formatting will be handled by the consumer
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
      {
        tokenMint: tokenMint,
        amount: -sellTokenAmount,
        owner: seller,
        source: 'swap',
      }
    );

    // Emit SOL balance change (positive as SOL is received)
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
      {
        tokenMint: '',
        amount: solReceived,
        owner: seller,
        source: 'swap',
      }
    );
  }

  /**
   * Get liquidity pools by token mint using getProgramAccounts with IndexedDB caching
   * @param tokenMint - The token mint address to filter pools by
   * @returns Array of liquidity pool accounts
   */

  /**
   * Get liquidity pool data for a token mint
   * @param tokenMint - The token mint address
   * @returns Array of PoolData objects containing both account and pubkey
   */
  private async getLiquidityPoolDataByTokenMint(
    tokenMint: string
  ): Promise<{ account: PoolAccount; pubkey: string }[]> {
    try {
      // Check cache for pools first
      const cachedPools = await liquidityPoolCache.getCachedPools(tokenMint);
      if (cachedPools) {
        console.log(`Using cached liquidity pools for token: ${tokenMint}`);
        return cachedPools;
      }

      // If no cached pools, fetch and decode them
      console.log(`Fetching liquidity pools from RPC for token: ${tokenMint}`);
      const programId = new PublicKey(PUMPFUN_AMM_PROGRAM_ID);

      let accounts = await this.connection.getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 43,
              bytes: tokenMint,
            },
          },
          {
            memcmp: {
              offset: 75,
              bytes: WRAPPED_SOL_MINT,
            },
          },
        ],
      });

      accounts = accounts.concat(
        await this.connection.getProgramAccounts(programId, {
          filters: [
            {
              memcmp: {
                offset: 43,
                bytes: WRAPPED_SOL_MINT,
              },
            },
            {
              memcmp: {
                offset: 75,
                bytes: tokenMint,
              },
            },
          ],
        })
      );

      // Create PoolData objects with both decoded account and pubkey
      const poolDataArray = accounts.map((poolResponse) => ({
        account: PoolAccount.fromBuffer(poolResponse.account.data),
        pubkey: poolResponse.pubkey.toBase58(),
      }));

      // Cache the pool data
      await liquidityPoolCache.cachePools(tokenMint, poolDataArray);

      return poolDataArray;
    } catch (error) {
      console.error('Error fetching decoded liquidity pools:', error);
      return [];
    }
  }

  private async getBestBuyPool(
    poolDataArray: { account: PoolAccount; pubkey: string }[]
  ): Promise<{
    poolData: { account: PoolAccount; pubkey: string } | null;
    price: number;
  }> {
    let bestPoolData: { account: PoolAccount; pubkey: string } | null = null;

    let bestPrice = 99999999999;

    for (const poolData of poolDataArray) {
      const poolAccount = poolData.account;
      if (bestPoolData === null) {
        bestPoolData = poolData;
      } else {
        const baseTokenAmount = await getBalance(
          poolAccount.poolBaseTokenAccount.toBase58()
        );

        const quoteTokenAmount = await getBalance(
          poolAccount.poolQuoteTokenAccount.toBase58()
        );

        let price = quoteTokenAmount / baseTokenAmount;

        if (poolAccount.baseMint.toBase58() === WRAPPED_SOL_MINT) {
          price = baseTokenAmount / quoteTokenAmount;
        }

        if (price < bestPrice) {
          bestPrice = price;

          bestPoolData = poolData;
        }
      }
    }

    return { poolData: bestPoolData, price: bestPrice };
  }

  async transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error('Transfer method not implemented for PumpFunAmm');
  }

  async buy(buyParameters: IBuyParameters): Promise<string | null> {
    try {
      // Get decoded liquidity pools for efficient processing
      const poolDataArray = await this.getLiquidityPoolDataByTokenMint(
        buyParameters.tokenMint
      );

      if (!poolDataArray || poolDataArray.length === 0) {
        throw new Error('No liquidity pools found for token');
      }

      // Get the best pool for buying using decoded pools
      const { poolData } = await this.getBestBuyPool(poolDataArray);

      if (!poolData) {
        throw new Error('No suitable pool found for buying');
      }

      const poolKey = new PublicKey(poolData.pubkey);

      // Create swap state using the SDK
      const swapSolanaState = await this.pumpAmmSdk.swapSolanaState(
        poolKey,
        buyParameters.buyer.publicKey
      );

      // Convert SOL amount to lamports and use as quote input
      const quoteAmount = new BN(buyParameters.amountInSol * LAMPORTS_PER_SOL);

      const slippage = buyParameters.slippageBasisPoints / 100; // Convert basis points to percentage

      // Use buyQuoteInput to buy tokens with SOL
      const instructions = await this.pumpAmmSdk.buyQuoteInput(
        swapSolanaState,
        quoteAmount,
        slippage
      );

      // Create and send the transaction
      const transaction = new Transaction();

      // Add priority fee instructions if specified
      if (
        buyParameters.priorityFeeInSol &&
        buyParameters.priorityFeeInSol > 0
      ) {
        // Use computeUnitsConsumed and costUnits from parameters if available, otherwise fallback to defaults
        const minUnitLimit =
          !buyParameters.computeUnitsConsumed ||
          buyParameters.computeUnitsConsumed < 200_000
            ? 200_000
            : buyParameters.computeUnitsConsumed;

        const unitLimit = Math.min(250_000, minUnitLimit);

        const unitPrice = Math.round(
          Math.max(
            buyParameters.costUnits || 0,
            Math.round(
              (buyParameters.priorityFeeInSol * LAMPORTS_PER_SOL * 1_000_000) /
                unitLimit
            )
          )
        );

        const priorityFees: PriorityFee = {
          unitLimit,
          unitPrice,
        };

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: priorityFees.unitLimit,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFees.unitPrice,
        });

        transaction.add(modifyComputeUnits);

        transaction.add(addPriorityFee);
      }

      instructions.forEach((instruction) => transaction.add(instruction));

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;

      transaction.feePayer = buyParameters.buyer.publicKey;

      // Sign and send the transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [buyParameters.buyer],
        {
          commitment: 'confirmed',
          maxRetries: 3,
          skipPreflight: true,
        }
      );

      console.log(`Buy transaction sent with signature: ${signature}`);

      // Decode instruction amounts from the 4th instruction
      const decodedAmounts = this.decodeInstructionAmounts(instructions, true);

      // Emit balance change events
      const solSpentLamports = buyParameters.amountInSol * LAMPORTS_PER_SOL;

      const priorityFeeLamports =
        (buyParameters.priorityFeeInSol || 0) * LAMPORTS_PER_SOL;

      const gasFee = 5000; // Default gas fee in lamports

      const totalSolSpentLamports =
        solSpentLamports + priorityFeeLamports + gasFee;

      // Extract token amount from decoded instruction data
      let tokensReceived: number;

      if (decodedAmounts && decodedAmounts.type === 'buy') {
        // For buy instructions, baseAmountOut represents tokens received
        tokensReceived = Number(decodedAmounts.baseAmount);
      } else {
        // Fallback to previous calculation if decoding fails
        console.warn(
          'Failed to decode instruction amounts, using fallback calculation'
        );
        tokensReceived = quoteAmount.toNumber() * 1000000;
      }

      await this.dispatchBuyEvents(
        buyParameters.tokenMint,
        buyParameters.buyer.publicKey,
        totalSolSpentLamports,
        tokensReceived
      );

      return signature;
    } catch (error) {
      console.error('Error in buy operation:', error);
      throw error;
    }
  }

  async sell(sellParameters: ISellParameters): Promise<string | null> {
    try {
      // Get decoded liquidity pools for efficient processing
      const poolDataArray = await this.getLiquidityPoolDataByTokenMint(
        sellParameters.mint.toBase58()
      );

      if (!poolDataArray || poolDataArray.length === 0) {
        throw new Error('No liquidity pools found for token');
      }

      // Get the best pool for selling using decoded pools
      const { poolData } = await this.getBestBuyPool(poolDataArray);

      if (!poolData) {
        throw new Error('No suitable pool found for selling');
      }

      const poolKey = new PublicKey(poolData.pubkey);

      // Create swap state using the SDK
      const swapSolanaState = await this.pumpAmmSdk.swapSolanaState(
        poolKey,
        sellParameters.seller.publicKey
      );

      // Convert token amount to BN and use as base input
      const baseAmount = new BN(sellParameters.sellTokenAmount.toString());

      const slippage = Number(sellParameters.slippageBasisPoints) / 100; // Convert basis points to percentage

      // Use sellBaseInput to sell tokens for SOL
      const instructions = await this.pumpAmmSdk.sellBaseInput(
        swapSolanaState,
        baseAmount,
        slippage
      );

      console.log(`Generated ${instructions.length} sell instructions`);

      // Create and send the transaction
      const transaction = new Transaction();

      // Add priority fee instructions if specified
      if (
        sellParameters.priorityFeeInSol &&
        sellParameters.priorityFeeInSol > 0
      ) {
        // Use computeUnitsConsumed and costUnits from parameters if available, otherwise fallback to defaults
        const minUnitLimit =
          !sellParameters.computeUnitsConsumed ||
          sellParameters.computeUnitsConsumed < 180_000
            ? 180_000
            : sellParameters.computeUnitsConsumed;

        const unitLimit = Math.min(200_000, minUnitLimit);

        const unitPrice = Math.round(
          Math.max(
            sellParameters.costUnits || 0,
            Math.round(
              (sellParameters.priorityFeeInSol * LAMPORTS_PER_SOL * 1_000_000) /
                unitLimit
            )
          )
        );

        const priorityFees: PriorityFee = {
          unitLimit,
          unitPrice,
        };

        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: priorityFees.unitLimit,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFees.unitPrice,
        });

        transaction.add(modifyComputeUnits);

        transaction.add(addPriorityFee);
      }

      instructions.forEach((instruction) => transaction.add(instruction));

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;

      transaction.feePayer = sellParameters.seller.publicKey;

      // Sign and send the transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [sellParameters.seller],
        {
          commitment: 'confirmed',
          maxRetries: 3,
          skipPreflight: true,
        }
      );

      console.log(`Sell transaction sent with signature: ${signature}`);

      // Decode instruction amounts from the 4th instruction
      const decodedAmounts = this.decodeInstructionAmounts(instructions, false);

      // Emit balance change events
      const priorityFeeLamports =
        (sellParameters.priorityFeeInSol || 0) * LAMPORTS_PER_SOL;

      const gasFee = 5000; // Default gas fee in lamports

      // Extract amounts from decoded instruction data
      let tokensSold: number;

      let solReceivedLamports: number;

      if (decodedAmounts && decodedAmounts.type === 'sell') {
        // For sell instructions, baseAmountIn represents tokens sold
        tokensSold = Number(decodedAmounts.baseAmount);

        // minQuoteAmountOut represents minimum SOL expected (we'll use this as estimate)
        solReceivedLamports = Number(decodedAmounts.quoteAmount);
      } else {
        // Fallback to previous calculation if decoding fails
        console.warn(
          'Failed to decode instruction amounts, using fallback calculation'
        );

        tokensSold = Number(sellParameters.sellTokenAmount);

        solReceivedLamports =
          (baseAmount.toNumber() / 1000000) * LAMPORTS_PER_SOL;
      }

      const netSolReceivedLamports =
        solReceivedLamports - priorityFeeLamports - gasFee;

      await this.dispatchSellEvents(
        sellParameters.mint.toBase58(),
        sellParameters.seller.publicKey,
        tokensSold,
        netSolReceivedLamports
      );

      return signature;
    } catch (error) {
      console.error('Error in sell operation:', error);
      throw error;
    }
  }

  async getBalance(address: string): Promise<number> {
    throw new Error('getBalance method not implemented for PumpFunAmm');
  }

  async getPrice(symbol: string): Promise<number> {
    throw new Error('getPrice method not implemented for PumpFunAmm');
  }

  async getTokenBalance(address: string, token: string): Promise<number> {
    throw new Error('getTokenBalance method not implemented for PumpFunAmm');
  }

  async swap(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    walletAddress: string
  ): Promise<void> {
    throw new Error('swap method not implemented for PumpFunAmm');
  }

  async withdraw(amount: number, token: string, to: string): Promise<void> {
    throw new Error('withdraw method not implemented for PumpFunAmm');
  }

  async jitoSell(
    sellParameters: ISellParameters[],
    jitoTipAmount: number,
    jitoUrl: string
  ): Promise<string | null> {
    throw new Error('jitoSell method not implemented for PumpFunAmm');
  }

  translateLogs(logs: string[]): TradeEventInfo {
    throw new Error('translateLogs method not implemented for PumpFunAmm');
  }
}
