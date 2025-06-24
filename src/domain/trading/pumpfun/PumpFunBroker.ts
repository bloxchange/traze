import type { IBroker } from "../IBroker";
import { Program, type Provider } from "@coral-xyz/anchor";
import type { PumpFun } from "./PumpFun";
import { PublicKey, type Connection } from "@solana/web3.js";
import { default as IDL } from "./idl.json";
import type { PumpFunBuyParameters } from "./BuyParameters";
import { getBondingCurvePDA } from "./utils";

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

  async buy(buyParameters: PumpFunBuyParameters): Promise<void> {
    const mint = new PublicKey(buyParameters.tokenMint);
    // Get bonding curve account
    const bondingCurvePDA = getBondingCurvePDA(mint, this.program.programId);

    const bondingAccount = await this.getBondingCurveAccount(mint, buyParameters.commitment);
    if (!bondingAccount) {
      throw new Error(`Bonding curve account not found: ${mint.toBase58()}`);
    }

    // Get global account
    // const [globalAccountPDA] = PublicKey.findProgramAddressSync(
    //   [Buffer.from(GLOBAL_ACCOUNT_SEED)],
    //   this.program.programId
    // );
    const globalAccount = await this.getGlobalAccount(commitment);

    // Calculate buy amount
    const buyAmount = bondingAccount.getBuyPrice(buyAmountSol);
    const buyAmountWithSlippage = calculateWithSlippageBuy(
      buyAmountSol,
      slippageBasisPoints
    );

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
    const bondingAccountInfo = await this.connection.getAccountInfo(bondingCurvePDA, commitment);
    if (!bondingAccountInfo) {
      throw new Error(`Bonding account info not found: ${bondingCurvePDA.toBase58()}`);
    }

    // Creator is at offset 49 (after 8 bytes discriminator, 5 BNs of 8 bytes each, and 1 byte boolean)
    const creatorBytes = bondingAccountInfo.data.subarray(49, 49 + 32);
    const creator = new PublicKey(creatorBytes);
    console.log("Creator from bonding curve:", creator.toString());

    // Get the creator vault PDA
    const [creatorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), creator.toBuffer()],
      this.program.programId
    );
    console.log("Creator vault PDA:", creatorVaultPda.toString());

    // Get event authority PDA
    // const [eventAuthorityPda] = PublicKey.findProgramAddressSync(
    //   [Buffer.from("__event_authority")],
    //   this.program.programId
    // );

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

    // Create buy instruction data
    //const discriminator = [102, 6, 61, 18, 1, 218, 235, 234]; // buy instruction discriminator
    const amountData = Buffer.alloc(8);
    amountData.writeBigUInt64LE(BigInt(buyAmount.toString()), 0);
    const slippageData = Buffer.alloc(8);
    slippageData.writeBigUInt64LE(BigInt(buyAmountWithSlippage.toString()), 0);
    // const instructionData = Buffer.from([
    //   ...discriminator,
    //   ...Array.from(amountData),
    //   ...Array.from(slippageData)
    // ]);

    // // Create accounts array in the exact order from buy_token_fixed.ts
    // const accounts = [
    //   { pubkey: globalAccountPDA, isSigner: false, isWritable: false },
    //   { pubkey: globalAccount.feeRecipient, isSigner: false, isWritable: true },
    //   { pubkey: mint, isSigner: false, isWritable: false },
    //   { pubkey: bondingCurvePDA, isSigner: false, isWritable: true },
    //   { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
    //   { pubkey: associatedUser, isSigner: false, isWritable: true },
    //   { pubkey: buyer.publicKey, isSigner: true, isWritable: true },
    //   { pubkey: new PublicKey(SYSTEM_PROGRAM_ID), isSigner: false, isWritable: false }, // SystemProgram
    //   { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false }, // TokenProgram
    //   { pubkey: creatorVaultPda, isSigner: false, isWritable: true },
    //   { pubkey: eventAuthorityPda, isSigner: false, isWritable: false },
    //   { pubkey: this.program.programId, isSigner: false, isWritable: false }
    // ];

    // Add the buy instruction (manually created to ensure correct account order)
    // transaction.add(
    //   new TransactionInstruction({
    //     keys: accounts,
    //     programId: this.program.programId,
    //     data: instructionData
    //   })
    // );

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
        user: buyer.publicKey,
        creatorVault: creatorVaultPda,
      } as any)
      .instruction();

    transaction.add(ix);

    // Send the transaction
    return await sendTx(
      this.connection,
      transaction,
      buyer.publicKey,
      [buyer],
      priorityFees,
      commitment,
      finality
    );
  }

  sell(amount: number, from: string, to: string): Promise<void> {
    throw new Error("Method not implemented.");
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
}