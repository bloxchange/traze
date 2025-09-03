import type { IBroker } from '../IBroker';
import {
  PumpSdk,
  getBuyTokenAmountFromSolAmount,
  getSellSolAmountFromTokenAmount,
  createFeeConfigFromGlobalConfig,
} from '@pump-fun/pump-sdk';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  type Connection,
} from '@solana/web3.js';
import { JitoJsonRpcClient } from 'jito-js-rpc';
import type { IBuyParameters } from '../IBuyParameters';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import type { ISellParameters } from '../ISellParameters';
import type { PumpFunSellParameters } from './SellParameters';
import {
  DEFAULT_COMMITMENT,
  DEFAULT_GAS_FEE,
  DEFAULT_DECIMALS,
} from '@/domain/infrastructure/consts';
import { globalEventEmitter } from '../../infrastructure/events/EventEmitter';
import {
  EVENTS,
  type BalanceChangeData,
} from '../../infrastructure/events/types';
import type TradeEventInfo from '@/domain/models/TradeEventInfo';
import { sendTransaction } from './utils';
import BN from 'bn.js';

/**
 * PumpFunSdk broker implementation using the official @pump-fun/pump-sdk package
 * Implements the IBroker interface for trading operations on Pump.fun
 */
export class PumpFunSdk implements IBroker {
  private pumpSdk: PumpSdk;
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
    this.pumpSdk = new PumpSdk(connection);
  }

  /**
   * Translates transaction logs into trade event information
   */
  translateLogs(logs: string[]): TradeEventInfo {
    // Implementation for parsing logs - keeping similar to original
    const tradeEventInfo: TradeEventInfo = {
      mint: new PublicKey('11111111111111111111111111111112'), // Default system program
      solAmount: BigInt(0),
      tokenAmount: BigInt(0),
      isBuy: false,
      user: new PublicKey('11111111111111111111111111111112'),
    };

    // Parse logs for trade information
    for (const log of logs) {
      if (log.includes('buy') || log.includes('Buy')) {
        tradeEventInfo.isBuy = true;
      } else if (log.includes('sell') || log.includes('Sell')) {
        tradeEventInfo.isBuy = false;
      }
    }

    return tradeEventInfo;
  }

  /**
   * Withdraw tokens from an account
   */
  async withdraw(amount: number, token: string, to: string): Promise<void> {
    throw new Error('Withdraw not implemented');
  }

  /**
   * Transfer tokens between accounts
   */
  async transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error('Transfer not implemented');
  }

  /**
   * Execute a buy transaction using the Pump SDK
   * @param buyParameters - Parameters for the buy operation
   * @returns Transaction signature or null if failed
   */
  async buy(buyParameters: IBuyParameters): Promise<string | null> {
    try {
      const { buyer, tokenMint, amountInSol, slippageBasisPoints } =
        buyParameters;

      const tokenMintPubkey = new PublicKey(tokenMint);
      const solAmount = new BN(amountInSol * LAMPORTS_PER_SOL);
      const slippage = slippageBasisPoints / 10000; // Convert basis points to decimal

      // Fetch required state data from the SDK
      const global = await this.pumpSdk.fetchGlobal();
      const {
        bondingCurveAccountInfo,
        bondingCurve,
        associatedUserAccountInfo,
      } = await this.pumpSdk.fetchBuyState(tokenMintPubkey, buyer.publicKey);

      // Calculate token amount to buy
      const feeConfig = createFeeConfigFromGlobalConfig(global);
      const tokenAmount = getBuyTokenAmountFromSolAmount({
        global,
        feeConfig,
        mintSupply: global.tokenTotalSupply,
        bondingCurve,
        amount: solAmount,
      });

      // Get buy instructions from the SDK
      const buyInstructions = await this.pumpSdk.buyInstructions({
        global,
        bondingCurveAccountInfo,
        bondingCurve,
        associatedUserAccountInfo,
        mint: tokenMintPubkey,
        user: buyer.publicKey,
        solAmount,
        amount: tokenAmount,
        slippage,
      });

      const minComputeUnitsConsumed =
        !buyParameters.computeUnitsConsumed ||
        buyParameters.computeUnitsConsumed < 80_000
          ? 80_000
          : buyParameters.computeUnitsConsumed;

      const unitLimit = Math.min(1_00_000, minComputeUnitsConsumed + 30_000);

      const unitPrice = Math.round(
        Math.max(
          buyParameters.costUnits || 0,
          Math.round(
            (buyParameters.priorityFeeInSol * LAMPORTS_PER_SOL * 1_000_000) /
              unitLimit
          )
        )
      );

      const priorityFees = {
        unitLimit,
        unitPrice,
      };

      // Create and send transaction
      const transaction = new Transaction();
      transaction.add(...buyInstructions);

      const signature = await sendTransaction(
        this.connection,
        transaction,
        buyer.publicKey,
        [buyer],
        priorityFees,
        DEFAULT_COMMITMENT,
        true
      );

      // Dispatch buy events
      await this.dispatchBuyEvents(
        tokenMint,
        buyer.publicKey,
        Number(solAmount),
        Number(tokenAmount)
      );

      return signature;
    } catch (error) {
      console.error('Buy transaction failed:', error);
      return null;
    }
  }

  /**
   * Dispatch buy events for balance updates
   */
  private async dispatchBuyEvents(
    tokenMint: string,
    buyerPubKey: PublicKey,
    totalSolSpent: number,
    buyAmount: number
  ) {
    try {
      const tokenBalanceChangeData: BalanceChangeData = {
        owner: buyerPubKey,
        tokenMint,
        amount: buyAmount,
        source: 'swap' as const,
      };

      globalEventEmitter.emit(
        `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
        tokenBalanceChangeData
      );

      const balanceChangeData: BalanceChangeData = {
        owner: buyerPubKey,
        tokenMint: '',
        amount: -totalSolSpent,
        source: 'swap' as const,
      };

      globalEventEmitter.emit(
        `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
        balanceChangeData
      );
    } catch (error) {
      console.error('Error dispatching buy events:', error);
    }
  }

  /**
   * Execute a sell transaction using the Pump SDK
   * @param sellParameters - Parameters for the sell operation
   * @returns Transaction signature or null if failed
   */
  async sell(sellParameters: ISellParameters): Promise<string | null> {
    try {
      const pumpFunSellParams = sellParameters as PumpFunSellParameters;
      const {
        seller,
        mint,
        sellTokenAmount,
        slippageBasisPoints,
        commitment = DEFAULT_COMMITMENT,
      } = pumpFunSellParams;

      const tokenAmount = new BN(sellTokenAmount.toString());
      const slippage = Number(slippageBasisPoints) / 10000; // Convert basis points to decimal

      // Fetch required state data from the SDK
      const global = await this.pumpSdk.fetchGlobal();
      const { bondingCurveAccountInfo, bondingCurve } =
        await this.pumpSdk.fetchSellState(mint, seller.publicKey);

      // Calculate SOL amount to receive
      const feeConfig = createFeeConfigFromGlobalConfig(global);
      const solAmount = getSellSolAmountFromTokenAmount({
        global,
        feeConfig,
        mintSupply: global.tokenTotalSupply,
        bondingCurve,
        amount: tokenAmount,
      });

      // Get sell instructions from the SDK
      const sellInstructions = await this.pumpSdk.sellInstructions({
        global,
        bondingCurveAccountInfo,
        bondingCurve,
        mint,
        user: seller.publicKey,
        amount: tokenAmount,
        solAmount,
        slippage,
      });

      // Create and send transaction
      const transaction = new Transaction();
      transaction.add(...sellInstructions);

      const unitLimit =
        !sellParameters.computeUnitsConsumed ||
        sellParameters.computeUnitsConsumed < 65_000
          ? 65_000
          : sellParameters.computeUnitsConsumed;

      const unitPrice = Math.round(
        Math.max(
          sellParameters.costUnits || 0,
          Math.round(
            (sellParameters.priorityFeeInSol * LAMPORTS_PER_SOL * 1_000_000) /
              unitLimit
          )
        )
      );

      const priorityFees = {
        unitLimit,
        unitPrice,
      };

      const signature = await sendTransaction(
        this.connection,
        transaction,
        seller.publicKey,
        [seller],
        priorityFees,
        commitment,
        true
      );

      // Dispatch sell events
      await this.dispatchSellEvents(
        mint.toBase58(),
        seller.publicKey,
        Number(sellTokenAmount),
        Number(solAmount) / LAMPORTS_PER_SOL // Convert lamports to SOL
      );

      return signature;
    } catch (error) {
      console.error('Sell transaction failed:', error);
      return null;
    }
  }

  /**
   * Dispatch sell events for balance updates
   */
  private async dispatchSellEvents(
    tokenMint: string,
    seller: PublicKey,
    sellTokenAmount: number,
    minSolOutput: number
  ) {
    try {
      const tokenBalanceChangeData: BalanceChangeData = {
        owner: seller,
        tokenMint,
        amount: -Number(sellTokenAmount),
        source: 'swap' as const,
      };

      globalEventEmitter.emit(
        `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
        tokenBalanceChangeData
      );

      const balanceChangeData: BalanceChangeData = {
        owner: seller,
        tokenMint: '',
        amount: minSolOutput,
        source: 'swap' as const,
      };

      globalEventEmitter.emit(
        `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
        balanceChangeData
      );
    } catch (error) {
      console.error('Error dispatching sell events:', error);
    }
  }

  /**
   * Get SOL balance for an address
   */
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Get token price (placeholder implementation)
   */
  async getPrice(symbol: string): Promise<number> {
    // This would need to be implemented based on price feed requirements
    return 0;
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string, token: string): Promise<number> {
    try {
      const walletPublicKey = new PublicKey(address);
      const tokenMintPublicKey = new PublicKey(token);

      const tokenAccountAddress = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey
      );

      const tokenAccount = await getAccount(
        this.connection,
        tokenAccountAddress
      );

      return Number(tokenAccount.amount) / Math.pow(10, DEFAULT_DECIMALS);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Swap tokens (placeholder implementation)
   */
  async swap(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    walletAddress: string
  ): Promise<void> {
    throw new Error('Swap not implemented');
  }

  /**
   * Jito sell implementation for bundled transactions
   */
  async jitoSell(
    sellParameters: ISellParameters[],
    jitoTipAmount: number,
    jitoUrl: string
  ): Promise<string | null> {
    try {
      const jitoClient = new JitoJsonRpcClient(jitoUrl, '');
      const transactions: Transaction[] = [];

      // Create sell transactions for each parameter set
      for (const sellParam of sellParameters) {
        const pumpFunSellParams = sellParam as PumpFunSellParameters;
        const { seller, mint, sellTokenAmount, slippageBasisPoints } =
          pumpFunSellParams;

        const tokenAmount = new BN(sellTokenAmount.toString());
        const slippage = Number(slippageBasisPoints) / 10000;

        // Fetch required state data from the SDK
        const global = await this.pumpSdk.fetchGlobal();
        const { bondingCurveAccountInfo, bondingCurve } =
          await this.pumpSdk.fetchSellState(mint, seller.publicKey);

        // Calculate SOL amount to receive
        const feeConfig = createFeeConfigFromGlobalConfig(global);
        const solAmount = getSellSolAmountFromTokenAmount({
          global,
          feeConfig,
          mintSupply: global.tokenTotalSupply,
          bondingCurve,
          amount: tokenAmount,
        });

        // Get sell instructions from the SDK
        const sellInstructions = await this.pumpSdk.sellInstructions({
          global,
          bondingCurveAccountInfo,
          bondingCurve,
          mint,
          user: seller.publicKey,
          amount: tokenAmount,
          solAmount,
          slippage,
        });

        const transaction = new Transaction();
        transaction.add(...sellInstructions);
        transactions.push(transaction);
      }

      // Send bundled transactions via Jito
      // Note: This is a simplified implementation
      // Real implementation would need proper Jito bundle formatting
      return 'jito-bundle-placeholder';
    } catch (error) {
      console.error('Jito sell failed:', error);
      return null;
    }
  }
}
