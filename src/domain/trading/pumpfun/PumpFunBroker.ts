import type { IBroker } from '../IBroker';
import { BN, Program, type Provider } from '@coral-xyz/anchor';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type Commitment,
  type Connection,
} from '@solana/web3.js';
import { JitoJsonRpcClient } from 'jito-js-rpc';
import { IDL, type PumpFun } from './idl';
import {
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
  getBondingCurveAccount,
  getBondingCurvePDA,
  getGlobalAccount,
  sendTransaction,
} from './utils';
import type { IBuyParameters } from '../IBuyParameters';
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import type { ISellParameters } from '../ISellParameters';
import type { PumpFunSellParameters } from './SellParameters';
import {
  DEFAULT_COMMITMENT,
  DEFAULT_GAS_FEE,
  DEFAULT_DECIMALS,
} from '@/domain/infrastructure/consts';
import type { BondingCurveAccount } from './BondingCurveAccount';
import { globalEventEmitter } from '../../infrastructure/events/EventEmitter';
import {
  EVENTS,
  type BalanceChangeData,
} from '../../infrastructure/events/types';
import type TradeEventInfo from '@/domain/models/TradeEventInfo';
import { GetTokenInformationCommand } from '../../commands/GetTokenInformationCommand';

/* eslint-disable */
export class PumpFunBroker implements IBroker {
  private program!: Program<PumpFun>;
  private connection: Connection;

  constructor(provider?: Provider) {
    this.program = new Program<PumpFun>(IDL as PumpFun, provider);

    this.connection = this.program.provider.connection;
  }

  translateLogs(logs: string[]): TradeEventInfo {
    const log = logs
      .find((x) => x.startsWith('Program data:'))!
      .split('Program data: ')[1];

    const logData = this.program.coder.events.decode(log!);

    const tradeEventInfo: TradeEventInfo = {
      mint: logData!.data.mint,
      solAmount: logData!.data.solAmount,
      tokenAmount: logData!.data.tokenAmount,
      isBuy: logData!.data.isBuy,
      user: logData!.data.user,
    };

    return tradeEventInfo;
  }

  withdraw(amount: number, token: string, to: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async buy(buyParameters: IBuyParameters): Promise<string | null> {
    const { transaction, buyAmount, buyAmountWithSlippage } =
      await this.createBuyTransaction(
        buyParameters.buyer,
        buyParameters.tokenMint,
        buyParameters.amountInSol,
        buyParameters.slippageBasisPoints,
        'finalized'
      );

    const estimatedUnitPrice =
      buyParameters.priorityFeeInSol * LAMPORTS_PER_SOL;

    const priorityFees = {
      unitLimit: 1_000_000,
      unitPrice: estimatedUnitPrice,
    };

    const totalSolSpent =
      (buyParameters.amountInSol + buyParameters.priorityFeeInSol) *
        LAMPORTS_PER_SOL +
      DEFAULT_GAS_FEE;

    await this.dispatchBuyEvents(
      buyParameters.tokenMint,
      buyParameters.buyer.publicKey,
      totalSolSpent,
      buyAmount
    );

    // Send the transaction
    const result = await sendTransaction(
      this.connection,
      transaction,
      buyParameters.buyer.publicKey,
      [buyParameters.buyer],
      priorityFees,
      'finalized'
    );

    if (!result) {
      await this.dispatchBuyEvents(
        buyParameters.tokenMint,
        buyParameters.buyer.publicKey,
        -totalSolSpent,
        -buyAmount
      );
    }

    return result;
  }

  private async dispatchBuyEvents(
    tokenMint: string,
    buyerPubKey: PublicKey,
    totalSolSpent: number,
    buyAmount: bigint
  ) {
    // Get token information to get decimals
    let decimals = DEFAULT_DECIMALS;
    try {
      const tokenInfo = await new GetTokenInformationCommand(tokenMint).execute();
      decimals = tokenInfo.decimals;
    } catch (error) {
      console.warn('Failed to get token decimals, using default:', error);
    }

    // Convert token amount from raw to decimal format
    const formattedTokenAmount = Number(buyAmount) / Math.pow(10, decimals);

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
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${buyerPubKey.toBase58()}`,
      {
        tokenMint: tokenMint,
        amount: formattedTokenAmount,
        owner: buyerPubKey,
        source: 'swap',
      }
    );
  }

  private async dispatchSellEvents(
    tokenMint: string,
    seller: PublicKey,
    sellTokenAmount: bigint,
    minSolOutput: number
  ) {
    // Get token information to get decimals
    let decimals = DEFAULT_DECIMALS;
    try {
      const tokenInfo = await new GetTokenInformationCommand(tokenMint).execute();
      decimals = tokenInfo.decimals;
    } catch (error) {
      console.warn('Failed to get token decimals, using default:', error);
    }

    // Convert token amount from raw to decimal format
    const formattedTokenAmount = Number(sellTokenAmount) / Math.pow(10, decimals);

    // Emit SOL balance change (positive as SOL is received)
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
      {
        tokenMint: '',
        amount: Number(minSolOutput),
        owner: seller,
        source: 'swap',
      }
    );

    // Emit token balance change (negative as tokens are sold)
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${seller.toBase58()}`,
      {
        tokenMint: tokenMint,
        amount: -formattedTokenAmount,
        owner: seller,
        source: 'swap',
      }
    );
  }

  private async getBuyAccounts(
    buyer: Keypair,
    tokenMint: string,
    commitment: Commitment
  ) {
    const mint = new PublicKey(tokenMint);

    // Get bonding curve account
    const bondingCurvePDA = getBondingCurvePDA(mint, this.program.programId);

    const bondingAccount = await getBondingCurveAccount(
      this.connection,
      bondingCurvePDA,
      commitment
    );

    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const globalAccount = await getGlobalAccount(this.connection, commitment);

    // Get the associated token accounts
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );

    const associatedUser = await getAssociatedTokenAddress(
      mint,
      buyer.publicKey,
      false
    );

    // Get bonding curve account info to extract creator
    const bondingAccountInfo = await this.connection.getAccountInfo(
      bondingCurvePDA,
      commitment
    );

    if (!bondingAccountInfo) {
      throw new Error(
        `Bonding account info not found: ${bondingCurvePDA.toBase58()}`
      );
    }

    // Creator is at offset 49 (after 8 bytes discriminator, 5 BNs of 8 bytes each, and 1 byte boolean)
    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);

    const creator = new PublicKey(creatorBytes);

    // Get the creator vault PDA
    const [creatorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('creator-vault'), creator.toBuffer()],
      this.program.programId
    );

    return {
      mint,
      creatorVaultPda,
      associatedUser,
      associatedBondingCurve,
      globalAccount,
      bondingAccount,
    };
  }

  private calculateBuyAmount(
    amountInSol: number,
    bondingAccount: BondingCurveAccount,
    slippageBasisPoints: number
  ) {
    const amountInLamports = BigInt(amountInSol * LAMPORTS_PER_SOL);

    const buyAmount = bondingAccount.getBuyPrice(amountInLamports);

    const buyAmountWithSlippage = calculateWithSlippageBuy(
      BigInt(amountInLamports),
      BigInt(slippageBasisPoints)
    );

    return {
      buyAmount,
      buyAmountWithSlippage,
    };
  }

  private async createBuyTransaction(
    buyer: Keypair,
    tokenMint: string,
    amountInSol: number,
    slippageBasisPoints: number,
    commitment: Commitment
  ) {
    const {
      mint,
      creatorVaultPda,
      associatedUser,
      associatedBondingCurve,
      globalAccount,
      bondingAccount,
    } = await this.getBuyAccounts(buyer, tokenMint, commitment);

    // Create a new transaction
    const transaction = new Transaction();

    // Add token account creation instruction if needed
    try {
      await getAccount(this.connection, associatedUser, commitment);
    } catch (e) {
      console.error(e);

      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyer.publicKey,
          associatedUser,
          buyer.publicKey,
          mint
        )
      );
    }

    const { buyAmount, buyAmountWithSlippage } = this.calculateBuyAmount(
      amountInSol,
      bondingAccount,
      slippageBasisPoints
    );

    // Create sell instruction using IDL
    const ix = await this.program.methods
      .buy(new BN(buyAmount), new BN(buyAmountWithSlippage))
      .accounts({
        feeRecipient: globalAccount.feeRecipient,
        mint: mint,
        associatedBondingCurve: associatedBondingCurve,
        associatedUser: associatedUser,
        user: buyer.publicKey,
        creatorVault: creatorVaultPda,
      } as any)
      .instruction();

    transaction.add(ix);

    return { transaction, buyAmount, buyAmountWithSlippage };
  }

  async sell(sellParameters: ISellParameters): Promise<string | null> {
    const { transaction, minSolOutput, sellAmountWithSlippage } =
      await this.createSellTransaction(
        sellParameters.mint,
        'finalized',
        sellParameters.sellTokenAmount,
        sellParameters.slippageBasisPoints,
        sellParameters.seller
      );

    const estimatedUnitPrice =
      sellParameters.priorityFeeInSol * LAMPORTS_PER_SOL;

    const priorityFees = {
      unitLimit: 1_000_000,
      unitPrice: estimatedUnitPrice,
    };

    const totalSolReceived =
      Number(minSolOutput) -
      sellParameters.priorityFeeInSol * LAMPORTS_PER_SOL -
      DEFAULT_GAS_FEE;

    // Dispatch events before sending transaction
    await this.dispatchSellEvents(
      sellParameters.mint.toBase58(),
      sellParameters.seller.publicKey,
      sellParameters.sellTokenAmount,
      totalSolReceived
    );

    const result = await sendTransaction(
      this.connection,
      transaction,
      sellParameters.seller.publicKey,
      [sellParameters.seller],
      priorityFees,
      'finalized'
    );

    // If transaction failed, dispatch reverse events
    if (!result) {
      // Reverse the sell events: negative SOL becomes positive, positive tokens become negative
      await this.dispatchSellEvents(
        sellParameters.mint.toBase58(),
        sellParameters.seller.publicKey,
        -sellParameters.sellTokenAmount,
        -totalSolReceived
      );
    }

    return result;
  }

  getBalance(address: string): Promise<number> {
    throw new Error('Method not implemented.');
  }

  getPrice(symbol: string): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async getTokenBalance(address: string, token: string): Promise<number> {
    const tokenPublicKey = new PublicKey(token);
    const ownerPublicKey = new PublicKey(address);
    const associatedTokenAddress = await getAssociatedTokenAddress(
      tokenPublicKey,
      ownerPublicKey
    );

    try {
      const account = await getAccount(this.connection, associatedTokenAddress);
      return Number(account.amount);
    } catch (error) {
      return 0; // Return 0 if token account doesn't exist
    }
  }

  swap(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    walletAddress: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private async getSellAccounts(
    seller: Keypair,
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT
  ) {
    const bondingCurvePDA = getBondingCurvePDA(mint, this.program.programId);

    const bondingAccount = await getBondingCurveAccount(
      this.connection,
      bondingCurvePDA,
      commitment
    );

    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const globalAccount = await getGlobalAccount(this.connection, commitment);

    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );

    const sellerPublicKey = seller.publicKey;

    const associatedUser = await getAssociatedTokenAddress(
      mint,
      sellerPublicKey,
      false
    );

    const bondingAccountInfo = await this.connection.getAccountInfo(
      bondingCurvePDA,
      commitment
    );

    if (!bondingAccountInfo) {
      throw new Error(
        `Bonding account info not found: ${bondingCurvePDA.toBase58()}`
      );
    }

    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);

    const creator = new PublicKey(creatorBytes);

    const [creatorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('creator-vault'), creator.toBuffer()],
      this.program.programId
    );

    return {
      creatorVaultPda,
      associatedUser,
      associatedBondingCurve,
      globalAccount,
      bondingAccount,
    };
  }

  // private methods
  async createSellTransaction(
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint,
    seller: Keypair
  ) {
    const {
      creatorVaultPda,
      associatedUser,
      associatedBondingCurve,
      globalAccount,
      bondingAccount,
    } = await this.getSellAccounts(seller, mint, commitment);

    const minSolOutput = bondingAccount.getSellPrice(
      sellTokenAmount,
      globalAccount.feeBasisPoints
    );

    let sellAmountWithSlippage = calculateWithSlippageSell(
      minSolOutput,
      slippageBasisPoints
    );

    if (sellAmountWithSlippage < 1n) {
      sellAmountWithSlippage = 1n;
    }

    const transaction = new Transaction();

    const ix = await this.program.methods
      .sell(new BN(sellTokenAmount), new BN(sellAmountWithSlippage))
      .accounts({
        feeRecipient: globalAccount.feeRecipient,
        mint: mint,
        associatedBondingCurve: associatedBondingCurve,
        associatedUser: associatedUser,
        user: seller.publicKey,
        creatorVault: creatorVaultPda,
      } as any)
      .instruction();

    transaction.add(ix);

    return { transaction, minSolOutput, sellAmountWithSlippage };
  }

  async jitoSell(
    sellParameters: ISellParameters[],
    jitoTipAmount: number,
    jitoUrl: string
  ): Promise<string | null> {
    const jitoClient = new JitoJsonRpcClient(jitoUrl);

    const randomTipAccount = await jitoClient.getRandomTipAccount();

    if (!randomTipAccount) {
      throw new Error('No tip accounts available');
    }

    const jitoTipAccount = new PublicKey(randomTipAccount);

    const transactions: string[] = [];

    for (const params of sellParameters) {
      const parameters = params as PumpFunSellParameters;

      const { transaction } = await this.createSellTransaction(
        parameters.mint,
        parameters.commitment,
        parameters.sellTokenAmount,
        parameters.slippageBasisPoints,
        parameters.seller
      );

      // Add tip instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: parameters.seller.publicKey,
          toPubkey: jitoTipAccount,
          lamports: jitoTipAmount,
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;

      transaction.feePayer = parameters.seller.publicKey;

      transaction.sign(parameters.seller);

      const serializedTransaction = transaction.serialize({
        verifySignatures: false,
      });

      const base64EncodedTransaction = Buffer.from(
        serializedTransaction
      ).toString('base64');

      transactions.push(base64EncodedTransaction);
    }

    try {
      const result = await jitoClient.sendBundle([
        transactions,
        { encoding: 'base64' },
      ]);

      const bundleId = result.result;

      if (!bundleId) {
        throw new Error('Failed to get bundle ID from response');
      }

      // Wait for confirmation
      const inflightStatus = await jitoClient.confirmInflightBundle(
        bundleId,
        120000
      ); // 2 minute timeout

      if ('status' in inflightStatus) {
        if (inflightStatus.status === 'Landed') {
          return bundleId;
        } else {
          throw new Error(
            `Bundle failed with status: ${inflightStatus.status}`
          );
        }
      } else if ('confirmation_status' in inflightStatus) {
        if (
          inflightStatus.confirmation_status === 'confirmed' ||
          inflightStatus.confirmation_status === 'finalized'
        ) {
          return bundleId;
        } else if (inflightStatus.err) {
          throw new Error(
            `Bundle processing failed: ${JSON.stringify(inflightStatus.err)}`
          );
        }
      }

      throw new Error(
        `Unexpected inflight bundle status: ${JSON.stringify(inflightStatus)}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (
          'response' in error &&
          typeof error.response === 'object' &&
          error.response &&
          'data' in error.response
        ) {
          throw new Error(
            `Error sending or confirming bundle: ${error.message}. Server response: ${JSON.stringify(error.response.data)}`
          );
        } else {
          throw new Error(
            `Error sending or confirming bundle: ${error.message}`
          );
        }
      }
      throw new Error(
        'An unknown error occurred while sending or confirming bundle'
      );
    }
  }
}
