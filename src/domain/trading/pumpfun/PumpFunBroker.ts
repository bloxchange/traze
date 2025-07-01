import type { IBroker } from "../IBroker";
import { BN, Program, type Provider } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, type Commitment, type Connection } from "@solana/web3.js";
import { JitoJsonRpcClient } from 'jito-js-rpc';
import { IDL, type PumpFun } from "./idl";
import type { PumpFunBuyParameters } from "./BuyParameters";
import {
  calculateWithSlippageBuy,
  calculateWithSlippageSell,
  getBondingCurveAccount,
  getBondingCurvePDA,
  getGlobalAccount,
  sendTransaction
} from "./utils";
import type { IBuyParameters } from "../IBuyParameters";
import { createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import type { ISellParameters } from "../ISellParameters";
import type { PumpFunSellParameters } from "./SellParameters";
import { DEFAULT_COMMITMENT } from "@/domain/infrastructure/consts";

/* eslint-disable */
export class PumpFunBroker implements IBroker {
  private program!: Program<PumpFun>;
  private connection: Connection;

  constructor(provider?: Provider) {
    this.program = new Program<PumpFun>(IDL as PumpFun, provider);

    this.connection = this.program.provider.connection;
  }

  withdraw(amount: number, token: string, to: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async buy(buyParameters: IBuyParameters): Promise<string | null> {
    const parameters = buyParameters as PumpFunBuyParameters;

    const mint = new PublicKey(buyParameters.tokenMint);

    // Get bonding curve account
    const bondingCurvePDA = getBondingCurvePDA(mint, this.program.programId);

    const bondingAccount = await getBondingCurveAccount(
      this.connection,
      mint,
      parameters.commitment);

    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const globalAccount = await getGlobalAccount(this.connection, parameters.commitment);

    const amountInLamports = BigInt(parameters.amountInSol * LAMPORTS_PER_SOL);

    // Calculate buy amount
    const buyAmount = bondingAccount.getBuyPrice(amountInLamports);

    const buyAmountWithSlippage = calculateWithSlippageBuy(
      BigInt(amountInLamports),
      BigInt(parameters.slippageBasisPoints)
    );

    // Get the associated token accounts
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePDA,
      true
    );

    const associatedUser = await getAssociatedTokenAddress(
      mint,
      parameters.buyer.publicKey,
      false
    );

    // Get bonding curve account info to extract creator 
    const bondingAccountInfo = await this.connection.getAccountInfo(bondingCurvePDA, parameters.commitment);

    if (!bondingAccountInfo) {
      throw new Error(`Bonding account info not found: ${bondingCurvePDA.toBase58()}`);
    }

    // Creator is at offset 49 (after 8 bytes discriminator, 5 BNs of 8 bytes each, and 1 byte boolean)
    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);

    const creator = new PublicKey(creatorBytes);

    // Get the creator vault PDA
    const [creatorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      this.program.programId
    );

    // Create a new transaction
    const transaction = new Transaction();

    // Add token account creation instruction if needed
    try {
      await getAccount(this.connection, associatedUser, parameters.commitment);
    } catch (e) {
      console.error(e);

      transaction.add(
        createAssociatedTokenAccountInstruction(
          parameters.buyer.publicKey,
          associatedUser,
          parameters.buyer.publicKey,
          mint
        )
      );
    }

    // Create buy instruction data
    const amountData = Buffer.alloc(8);
    amountData.writeBigUInt64LE(BigInt(buyAmount.toString()), 0);

    const slippageData = Buffer.alloc(8);
    slippageData.writeBigUInt64LE(BigInt(buyAmountWithSlippage.toString()), 0);

    // Create sell instruction using IDL
    const ix = await this.program.methods
      .buy(
        new BN(buyAmount),
        new BN(buyAmountWithSlippage)
      )
      .accounts({
        feeRecipient: globalAccount.feeRecipient,
        mint: mint,
        associatedBondingCurve: associatedBondingCurve,
        associatedUser: associatedUser,
        user: parameters.buyer.publicKey,
        creatorVault: creatorVaultPda,
      } as any)
      .instruction();

    transaction.add(ix);

    // Send the transaction
    return await sendTransaction(
      this.connection,
      transaction,
      parameters.buyer.publicKey,
      [parameters.buyer],
      parameters.priorityFees,
      parameters.commitment
    );
  }

  async sell(sellParameters: ISellParameters): Promise<string | null> {
    const parameters = sellParameters as PumpFunSellParameters;

    const transaction = await this.createSellTransaction(
      parameters.mint,
      parameters.commitment,
      parameters.sellTokenAmount,
      parameters.slippageBasisPoints,
      parameters.seller);

    return await sendTransaction(
      this.connection,
      transaction,
      parameters.seller.publicKey,
      [parameters.seller],
      parameters.priorityFees,
      parameters.commitment
    );
  }

  getBalance(address: string): Promise<number> {
    throw new Error("Method not implemented.");
  }

  getPrice(symbol: string): Promise<number> {
    throw new Error("Method not implemented.");
  }

  getTokenBalance(address: string, token: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  swap(fromToken: string, toToken: string, fromAmount: number, toAmount: number, walletAddress: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // private methods
  async createSellTransaction(
    mint: PublicKey,
    commitment: Commitment = DEFAULT_COMMITMENT,
    sellTokenAmount: bigint,
    slippageBasisPoints: bigint,
    seller: Keypair
  ) {
    const bondingCurvePDA = getBondingCurvePDA(mint, this.program.programId);

    const bondingAccount = await getBondingCurveAccount(
      this.connection,
      mint,
      commitment);

    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    const globalAccount = await getGlobalAccount(this.connection, commitment);

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

    const bondingAccountInfo = await this.connection.getAccountInfo(bondingCurvePDA, commitment);

    if (!bondingAccountInfo) {
      throw new Error(`Bonding account info not found: ${bondingCurvePDA.toBase58()}`);
    }

    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);

    const creator = new PublicKey(creatorBytes);

    const [creatorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      this.program.programId
    );

    const transaction = new Transaction();

    const ix = await this.program.methods
      .sell(
        new BN(sellTokenAmount),
        new BN(sellAmountWithSlippage)
      )
      .accounts({
        feeRecipient: globalAccount.feeRecipient,
        mint: mint,
        associatedBondingCurve: associatedBondingCurve,
        associatedUser: associatedUser,
        user: sellerPublicKey,
        creatorVault: creatorVaultPda,
      } as any)
      .instruction();

    transaction.add(ix);

    return transaction;
  }

  async jitoSell(sellParameters: ISellParameters[], jitoTipAmount: number, jitoUrl: string): Promise<string | null> {
    const jitoClient = new JitoJsonRpcClient(jitoUrl);
    const randomTipAccount = await jitoClient.getRandomTipAccount();
    if (!randomTipAccount) {
      throw new Error('No tip accounts available');
    }

    const jitoTipAccount = new PublicKey(randomTipAccount);
    const transactions: string[] = [];

    for (const params of sellParameters) {
      const parameters = params as PumpFunSellParameters;
      const transaction = await this.createSellTransaction(
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

      const serializedTransaction = transaction.serialize({verifySignatures: false});
      const base64EncodedTransaction = Buffer.from(serializedTransaction).toString('base64');
      transactions.push(base64EncodedTransaction);
    }

    try {
      const result = await jitoClient.sendBundle([transactions, { encoding: 'base64' }]);
      const bundleId = result.result;
      if (!bundleId) {
        throw new Error('Failed to get bundle ID from response');
      }

      // Wait for confirmation
      const inflightStatus = await jitoClient.confirmInflightBundle(bundleId, 120000); // 2 minute timeout
      
      if ('status' in inflightStatus) {
        if (inflightStatus.status === 'Landed') {
          return bundleId;
        } else {
          throw new Error(`Bundle failed with status: ${inflightStatus.status}`);
        }
      } else if ('confirmation_status' in inflightStatus) {
        if (inflightStatus.confirmation_status === 'confirmed' || inflightStatus.confirmation_status === 'finalized') {
          return bundleId;
        } else if (inflightStatus.err) {
          throw new Error(`Bundle processing failed: ${JSON.stringify(inflightStatus.err)}`);
        }
      }
      
      throw new Error(`Unexpected inflight bundle status: ${JSON.stringify(inflightStatus)}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response && 'data' in error.response) {
          throw new Error(`Error sending or confirming bundle: ${error.message}. Server response: ${JSON.stringify(error.response.data)}`);
        } else {
          throw new Error(`Error sending or confirming bundle: ${error.message}`);
        }
      }
      throw new Error('An unknown error occurred while sending or confirming bundle')
    }
  }
}
