import type { IBroker } from '../IBroker';
import type { IBuyParameters } from '../IBuyParameters';
import type { ISellParameters } from '../ISellParameters';
import type TradeEventInfo from '../../models/TradeEventInfo';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  Raydium,
  TxVersion,
  LAUNCHPAD_PROGRAM,
  DEV_LAUNCHPAD_PROGRAM,
  Curve,
  getPdaLaunchpadPoolId,
} from '@raydium-io/raydium-sdk-v2';
import { globalEventEmitter } from '../../infrastructure/events/EventEmitter';
import {
  EVENTS,
  type BalanceChangeData,
} from '../../infrastructure/events/types';
import { getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token';
import BN from 'bn.js';
import Decimal from 'decimal.js';
import {
  WRAPPED_SOL_MINT,
  DEFAULT_DECIMALS,
} from '@/domain/infrastructure/consts';
import { GetTokenInformationCommand } from '../../commands/GetTokenInformationCommand';

export interface RaydiumLaunchPadConfig {
  connection: Connection;
  isDevnet?: boolean;
}

export interface LaunchpadPoolInfo {
  id: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  totalSupply: BN;
  totalSell: BN;
  totalFundRaising: BN;
  currentQuoteFund: BN;
  status: number; // 0: trading, 1: migrate
}

export class RaydiumLaunchPadBroker implements IBroker {
  private connection: Connection;
  private programId: PublicKey;
  private raydium: Raydium | null = null;
  private isDevnet: boolean;

  constructor(config: RaydiumLaunchPadConfig) {
    this.connection = config.connection;
    this.programId = config.isDevnet
      ? DEV_LAUNCHPAD_PROGRAM
      : LAUNCHPAD_PROGRAM;

    this.isDevnet = config.isDevnet || false;
  }

  private async initializeRaydium(): Promise<Raydium> {
    if (!this.raydium) {
      this.raydium = await Raydium.load({
        connection: this.connection,
        cluster: this.isDevnet ? 'devnet' : 'mainnet',
        disableLoadToken: true, // We don't need token info for launchpad operations
      });
    }
    return this.raydium;
  }

  async transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error('Transfer method not implemented for Raydium LaunchLab');
  }

  async buy(buyParameters: IBuyParameters): Promise<string | null> {
    try {
      console.log('Raydium LaunchLab buy operation started', {
        tokenMint: buyParameters.tokenMint,
        amountInSol: buyParameters.amountInSol,
        slippage: buyParameters.slippageBasisPoints,
      });

      // Initialize Raydium SDK
      const raydium = await this.initializeRaydium();

      raydium.setOwner(buyParameters.buyer);

      const buyerKeypair = buyParameters.buyer;
      const mintA = new PublicKey(buyParameters.tokenMint);

      //const mintB = NATIVE_MINT;

      const inAmount = new BN(
        Math.floor(buyParameters.amountInSol * LAMPORTS_PER_SOL)
      );

      // // Get pool ID and pool info
      // const poolId = getPdaLaunchpadPoolId(this.programId, mintA, mintB).publicKey;
      // const poolInfo = await raydium.launchpad.getRpcPoolInfo({ poolId });

      // if (!poolInfo) {
      //   throw new Error('Launchpad pool not found');
      // }

      // Execute the buy transaction using the correct parameter names
      const { execute, extInfo } = await raydium.launchpad.buyToken({
        programId: this.programId,
        mintA: mintA,
        buyAmount: inAmount,
        slippage: new BN(buyParameters.slippageBasisPoints),
        shareFeeRate: new BN(0),
        txVersion: TxVersion.V0,
        computeBudgetConfig: {
          units: Math.round((buyParameters.computeUnitsConsumed || 70_000) * 1.3),
          microLamports: Math.round(Math.max(
            buyParameters.costUnits || 0,
            (buyParameters.priorityFeeInSol * LAMPORTS_PER_SOL * 1_000_000) / Math.round((buyParameters.computeUnitsConsumed || 70_000) * 1.3)
          )),
        },
      });

      const sentInfo = await execute({ sendAndConfirm: true });

      // Dispatch buy events
      await this.dispatchBuyEvents(
        buyParameters.tokenMint,
        buyerKeypair.publicKey,
        buyParameters.amountInSol * LAMPORTS_PER_SOL,
        Number(extInfo?.decimalOutAmount)
      );

      return sentInfo.txId;
    } catch (error) {
      console.error('Raydium LaunchLab buy failed:', error);
      return null;
    }
  }

  async sell(sellParameters: ISellParameters): Promise<string | null> {
    try {
      console.log('Raydium LaunchLab sell operation started', {
        mint: sellParameters.mint,
        sellTokenAmount: sellParameters.sellTokenAmount,
        slippage: sellParameters.slippageBasisPoints,
      });

      // Initialize Raydium SDK
      const raydium = await this.initializeRaydium();

      raydium.setOwner(sellParameters.seller);

      const sellerKeypair = sellParameters.seller;
      const mintA = new PublicKey(sellParameters.mint);

      //const mintB = NATIVE_MINT;

      // // Get pool ID and pool info
      // const poolId = getPdaLaunchpadPoolId(this.programId, mintA, mintB).publicKey;
      // const poolInfo = await raydium.launchpad.getRpcPoolInfo({ poolId });

      // if (!poolInfo) {
      //   throw new Error('Launchpad pool not found');
      // }

      // Execute the buy transaction using the correct parameter names
      const { execute, extInfo } = await raydium.launchpad.sellToken({
        programId: this.programId,
        mintA: mintA,
        sellAmount: new BN(sellParameters.sellTokenAmount),
        slippage: new BN(sellParameters.slippageBasisPoints),
        shareFeeRate: new BN(0),
        txVersion: TxVersion.V0,
        computeBudgetConfig: {
          units: Math.round((sellParameters.computeUnitsConsumed || 70_000) * 1.3),
          microLamports: Math.round(Math.max(
            sellParameters.costUnits || 0,
            (sellParameters.priorityFeeInSol * LAMPORTS_PER_SOL * 1_000_000) / Math.round((sellParameters.computeUnitsConsumed || 70_000) * 1.3)
          )),
        },
      });

      const sentInfo = await execute({ sendAndConfirm: true });

      // Dispatch buy events
      await this.dispatchSellEvents(
        sellParameters.mint.toBase58(),
        sellerKeypair.publicKey,
        Number(sellParameters.sellTokenAmount),
        Number(extInfo?.outAmount)
      );

      return sentInfo.txId;
    } catch (error) {
      console.error('Raydium LaunchLab sell failed:', error);
      return null;
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  async getPrice(symbol: string): Promise<number> {
    throw new Error('getPrice method not implemented for Raydium LaunchLab');
  }

  async getTokenBalance(address: string, token: string): Promise<number> {
    try {
      const walletPublicKey = new PublicKey(address);
      const tokenMint = new PublicKey(token);

      const tokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        walletPublicKey
      );

      const balance =
        await this.connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return 0;
    }
  }

  async swap(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    walletAddress: string
  ): Promise<void> {
    throw new Error('Swap method not implemented for Raydium LaunchLab');
  }

  async withdraw(amount: number, token: string, to: string): Promise<void> {
    throw new Error('Withdraw method not implemented for Raydium LaunchLab');
  }

  async jitoSell(
    sellParameters: ISellParameters[],
    jitoTipAmount: number,
    jitoUrl: string
  ): Promise<string | null> {
    throw new Error('Jito sell not implemented for Raydium LaunchLab');
  }

  translateLogs(logs: string[]): TradeEventInfo {
    // Placeholder implementation
    return {
      mint: new PublicKey('11111111111111111111111111111111'),
      solAmount: BigInt(0),
      tokenAmount: BigInt(0),
      isBuy: false,
      user: new PublicKey('11111111111111111111111111111111'),
    };
  }

  private async getPoolInfo(
    poolId: PublicKey
  ): Promise<LaunchpadPoolInfo | null> {
    try {
      const accountInfo = await this.connection.getAccountInfo(poolId);
      if (!accountInfo) {
        return null;
      }

      // TODO: Decode pool account data using proper layout
      // This is a placeholder - actual implementation would decode the account data
      return {
        id: poolId,
        baseMint: new PublicKey('11111111111111111111111111111111'), // Placeholder
        quoteMint: new PublicKey('11111111111111111111111111111111'), // Placeholder
        baseVault: new PublicKey('11111111111111111111111111111111'), // Placeholder
        quoteVault: new PublicKey('11111111111111111111111111111111'), // Placeholder
        totalSupply: new BN(0),
        totalSell: new BN(0),
        totalFundRaising: new BN(0),
        currentQuoteFund: new BN(0),
        status: 0,
      };
    } catch (error) {
      console.error('Failed to get pool info:', error);
      return null;
    }
  }

  private async dispatchBuyEvents(
    tokenMint: string,
    buyerPubKey: PublicKey,
    totalSolSpent: number,
    tokensReceived: number
  ) {
    // Get token information to get decimals
    let decimals = DEFAULT_DECIMALS;
    try {
      const tokenInfo = await new GetTokenInformationCommand(
        tokenMint
      ).execute();
      decimals = tokenInfo.decimals;
    } catch (error) {
      console.warn('Failed to get token decimals, using default:', error);
    }

    // Convert token amount from raw to decimal format
    const formattedTokenAmount = tokensReceived / Math.pow(10, decimals);

    // Emit SOL balance change (negative) with buyer-specific event key
    const solBalanceChange: BalanceChangeData = {
      tokenMint: '',
      amount: -totalSolSpent,
      owner: buyerPubKey,
      source: 'swap' as const,
    };
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
      solBalanceChange
    );

    // Emit token balance change (positive) with buyer-specific event key
    const tokenBalanceChange: BalanceChangeData = {
      tokenMint: tokenMint,
      amount: formattedTokenAmount,
      owner: buyerPubKey,
      source: 'swap' as const,
    };
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
      tokenBalanceChange
    );
  }

  private async dispatchSellEvents(
    tokenMint: string,
    seller: PublicKey,
    sellTokenAmount: number,
    solReceived: number
  ) {
    // Get token information to get decimals
    let decimals = DEFAULT_DECIMALS;
    try {
      const tokenInfo = await new GetTokenInformationCommand(
        tokenMint
      ).execute();
      decimals = tokenInfo.decimals;
    } catch (error) {
      console.warn('Failed to get token decimals, using default:', error);
    }

    // Convert token amount from raw to decimal format
    const formattedTokenAmount = sellTokenAmount / Math.pow(10, decimals);

    // Emit token balance change (negative) with seller-specific event key
    const tokenBalanceChange: BalanceChangeData = {
      tokenMint: tokenMint,
      amount: -formattedTokenAmount,
      owner: seller,
      source: 'swap' as const,
    };
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
      tokenBalanceChange
    );

    // Emit SOL balance change (positive) with seller-specific event key
    const solBalanceChange: BalanceChangeData = {
      tokenMint: '',
      amount: solReceived,
      owner: seller,
      source: 'swap' as const,
    };
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
      solBalanceChange
    );
  }
}
