import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
} from '@solana/web3.js';
import { Program, type Provider, BN } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import IDL from './idl/idl.json';
import {
  BUY_DISCRIMINATOR,
  SELL_DISCRIMINATOR,
  TOKEN_DECIMALS,
  FEE_RECIPIENT,
  GLOBAL,
  EVENT_AUTHORITY,
  WRAPPED_SOL_MINT,
  PUMPFUN_AMM_PROGRAM_ID,
} from '../../infrastructure/consts';

export interface PumpFunAmmConfig {
  provider: Provider;
  programId?: PublicKey;
}

export interface BuyParams {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseAmountOut: BN;
  maxQuoteAmountIn: BN;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
  poolId: PublicKey;
  poolData: PoolInfo;
  tokenAmount: number;
  wsolTokenAccount: PublicKey;
}

export interface SellParams {
  baseMint: PublicKey;
  quoteMint: PublicKey;
  baseAmountIn: BN;
  minQuoteAmountOut: BN;
  userBaseTokenAccount: PublicKey;
  userQuoteTokenAccount: PublicKey;
}

export interface PoolInfo {
  poolBump: number;
  index: number;
  creator: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  poolBaseTokenAccount: PublicKey;
  poolQuoteTokenAccount: PublicKey;
  lpSupply: BN;
  coinCreator: PublicKey;
}

export interface GlobalConfigInfo {
  admin: PublicKey;
  lpFeeBasisPoints: BN;
  protocolFeeBasisPoints: BN;
  disableFlags: number;
  protocolFeeRecipients: PublicKey[];
  coinCreatorFeeBasisPoints: BN;
  adminSetCoinCreatorAuthority: PublicKey;
}

export class PumpFunAmmBroker {
  private program: Program;
  private connection: Connection;
  private programId: PublicKey;

  constructor(config: PumpFunAmmConfig) {
    this.programId =
      config.programId ||
      new PublicKey('pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA');
    this.program = new Program(IDL as any, config.provider);
    this.connection = this.program.provider.connection;
  }

  /**
   * Get global configuration
   */
  async getGlobalConfig(): Promise<GlobalConfigInfo> {
    const [globalConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global_config')],
      this.programId
    );

    const globalConfig = await (this.program.account as any).globalConfig.fetch(
      globalConfigPda
    );
    return globalConfig as GlobalConfigInfo;
  }

  /**
   * Get pool information
   */
  async getPool(poolAddress: PublicKey): Promise<PoolInfo> {
    const pool = await (this.program.account as any).pool.fetch(poolAddress);
    return pool as PoolInfo;
  }

  /**
   * Get global volume accumulator PDA
   */
  getGlobalVolumeAccumulatorPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global_volume_accumulator')],
      this.programId
    );
    return pda;
  }

  /**
   * Get user volume accumulator PDA
   */
  getUserVolumeAccumulatorPda(user: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_volume_accumulator'), user.toBuffer()],
      this.programId
    );
    return pda;
  }

  /**
   * Get coin creator vault authority PDA
   */
  getCoinCreatorVaultAuthorityPda(coinCreator: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('creator_vault'), coinCreator.toBuffer()],
      this.programId
    );
    return pda;
  }

  /**
   * Get event authority PDA
   */
  getEventAuthorityPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('__event_authority')],
      this.programId
    );
    return pda;
  }

  /**
   * Create a buy instruction
   */
  async createBuyInstruction(
    params: BuyParams
  ): Promise<TransactionInstruction> {
    const userPublicKey = this.program.provider.publicKey!;

    // Determine user token accounts based on base mint
    let userBaseTokenAccount: PublicKey;
    let userQuoteTokenAccount: PublicKey;
    let instructionData: Buffer;

    if (params.poolData.baseMint.equals(new PublicKey(WRAPPED_SOL_MINT))) {
      // Selling case: base is WSOL, quote is token
      userBaseTokenAccount = params.wsolTokenAccount;
      userQuoteTokenAccount = await getAssociatedTokenAddress(
        params.poolData.quoteMint,
        userPublicKey
      );

      // Create sell instruction data
      const maxAmountLamports = Buffer.alloc(8);
      maxAmountLamports.writeBigUInt64LE(
        BigInt(params.maxQuoteAmountIn.toString()),
        0
      );

      const tokenAmountBuffer = Buffer.alloc(8);
      tokenAmountBuffer.writeBigUInt64LE(
        BigInt(params.tokenAmount * TOKEN_DECIMALS),
        0
      );

      instructionData = Buffer.concat([
        Buffer.from(SELL_DISCRIMINATOR),
        maxAmountLamports,
        tokenAmountBuffer,
      ]);
    } else {
      // Buying case: base is token, quote is WSOL
      userBaseTokenAccount = await getAssociatedTokenAddress(
        params.poolData.baseMint,
        userPublicKey
      );
      userQuoteTokenAccount = params.wsolTokenAccount;

      // Create buy instruction data
      const tokenAmountBuffer = Buffer.alloc(8);
      tokenAmountBuffer.writeBigUInt64LE(
        BigInt(params.tokenAmount * TOKEN_DECIMALS),
        0
      );

      const maxAmountLamports = Buffer.alloc(8);
      maxAmountLamports.writeBigUInt64LE(
        BigInt(params.maxQuoteAmountIn.toString()),
        0
      );

      instructionData = Buffer.concat([
        Buffer.from(BUY_DISCRIMINATOR),
        tokenAmountBuffer,
        maxAmountLamports,
      ]);
    }

    // Create vault authority PDA
    const vaultAuthSeeds = [
      Buffer.from('creator_vault'),
      params.poolData.coinCreator.toBuffer(),
    ];
    const [vaultAuthPda] = PublicKey.findProgramAddressSync(
      vaultAuthSeeds,
      new PublicKey(PUMPFUN_AMM_PROGRAM_ID)
    );

    const vaultAta = await getAssociatedTokenAddress(
      params.poolData.baseMint,
      vaultAuthPda
    );

    const feeRecipientAta = await getAssociatedTokenAddress(
      params.poolData.baseMint,
      new PublicKey(FEE_RECIPIENT)
    );

    // Create instruction with all required accounts
    return new TransactionInstruction({
      programId: new PublicKey(PUMPFUN_AMM_PROGRAM_ID),
      data: instructionData,
      keys: [
        { pubkey: params.poolId, isSigner: false, isWritable: false },
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(GLOBAL), isSigner: false, isWritable: false },
        {
          pubkey: params.poolData.baseMint,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: params.poolData.quoteMint,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: userBaseTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userQuoteTokenAccount, isSigner: false, isWritable: true },
        {
          pubkey: params.poolData.poolBaseTokenAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: params.poolData.poolQuoteTokenAccount,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: new PublicKey(FEE_RECIPIENT),
          isSigner: false,
          isWritable: false,
        },
        { pubkey: feeRecipientAta, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: new PublicKey(EVENT_AUTHORITY),
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: new PublicKey(PUMPFUN_AMM_PROGRAM_ID),
          isSigner: false,
          isWritable: false,
        },
        { pubkey: vaultAta, isSigner: false, isWritable: true },
        { pubkey: vaultAuthPda, isSigner: false, isWritable: false },
      ],
    });
  }

  /**
   * Create a sell instruction
   */
  async createSellInstruction(
    params: SellParams
  ): Promise<TransactionInstruction> {
    const globalConfig = await this.getGlobalConfig();

    const userPublicKey = this.program.provider.publicKey!;

    const protocolFeeRecipient = globalConfig.protocolFeeRecipients[0];
    const protocolFeeRecipientTokenAccount = await getAssociatedTokenAddress(
      params.quoteMint,
      protocolFeeRecipient
    );

    const globalVolumeAccumulator = this.getGlobalVolumeAccumulatorPda();
    const userVolumeAccumulator =
      this.getUserVolumeAccumulatorPda(userPublicKey);

    return await this.program.methods
      .sell(params.baseAmountIn, params.minQuoteAmountOut)
      .accounts({
        user: userPublicKey,
        userBaseTokenAccount: params.userBaseTokenAccount,
        userQuoteTokenAccount: params.userQuoteTokenAccount,
        protocolFeeRecipientTokenAccount,
        //globalVolumeAccumulator,
        //userVolumeAccumulator,
      })
      .instruction();
  }

  /**
   * Execute a buy transaction
   */
  async buy(params: BuyParams): Promise<string> {
    const instruction = await this.createBuyInstruction(params);
    const transaction = new Transaction().add(instruction);

    const signature = await this.program.provider.sendAndConfirm!(transaction);

    return signature;
  }

  /**
   * Execute a sell transaction
   */
  async sell(params: SellParams): Promise<string> {
    const instruction = await this.createSellInstruction(params);
    const transaction = new Transaction().add(instruction);

    const signature = await this.program.provider.sendAndConfirm!(transaction);
    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }

  /**
   * Get global config PDA
   */
  private async getGlobalConfigPda(): Promise<PublicKey> {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('global_config')],
      this.programId
    );
    return pda;
  }

  /**
   * Calculate quote amount for a given base amount (buy)
   */
  async calculateBuyQuote(pool: PublicKey, baseAmountOut: BN): Promise<BN> {
    const poolInfo = await this.getPool(pool);
    const globalConfig = await this.getGlobalConfig();

    // Get current pool reserves
    const baseReserves = await this.connection.getTokenAccountBalance(
      poolInfo.poolBaseTokenAccount
    );
    const quoteReserves = await this.connection.getTokenAccountBalance(
      poolInfo.poolQuoteTokenAccount
    );

    const baseReservesAmount = new BN(baseReserves.value.amount);
    const quoteReservesAmount = new BN(quoteReserves.value.amount);

    // Simple constant product formula: x * y = k
    // quoteAmountIn = (quoteReserves * baseAmountOut) / (baseReserves - baseAmountOut)
    const numerator = quoteReservesAmount.mul(baseAmountOut);
    const denominator = baseReservesAmount.sub(baseAmountOut);

    if (denominator.lte(new BN(0))) {
      throw new Error('Insufficient liquidity');
    }

    let quoteAmountIn = numerator.div(denominator);

    // Add fees
    const lpFee = quoteAmountIn
      .mul(globalConfig.lpFeeBasisPoints)
      .div(new BN(10000));
    const protocolFee = quoteAmountIn
      .mul(globalConfig.protocolFeeBasisPoints)
      .div(new BN(10000));
    const coinCreatorFee = quoteAmountIn
      .mul(globalConfig.coinCreatorFeeBasisPoints)
      .div(new BN(10000));

    return quoteAmountIn.add(lpFee).add(protocolFee).add(coinCreatorFee);
  }

  /**
   * Calculate base amount for a given quote amount (sell)
   */
  async calculateSellQuote(pool: PublicKey, baseAmountIn: BN): Promise<BN> {
    const poolInfo = await this.getPool(pool);
    const globalConfig = await this.getGlobalConfig();

    // Get current pool reserves
    const baseReserves = await this.connection.getTokenAccountBalance(
      poolInfo.poolBaseTokenAccount
    );
    const quoteReserves = await this.connection.getTokenAccountBalance(
      poolInfo.poolQuoteTokenAccount
    );

    const baseReservesAmount = new BN(baseReserves.value.amount);
    const quoteReservesAmount = new BN(quoteReserves.value.amount);

    // Simple constant product formula: x * y = k
    // quoteAmountOut = (quoteReserves * baseAmountIn) / (baseReserves + baseAmountIn)
    const numerator = quoteReservesAmount.mul(baseAmountIn);
    const denominator = baseReservesAmount.add(baseAmountIn);

    let quoteAmountOut = numerator.div(denominator);

    // Subtract fees
    const lpFee = quoteAmountOut
      .mul(globalConfig.lpFeeBasisPoints)
      .div(new BN(10000));
    const protocolFee = quoteAmountOut
      .mul(globalConfig.protocolFeeBasisPoints)
      .div(new BN(10000));
    const coinCreatorFee = quoteAmountOut
      .mul(globalConfig.coinCreatorFeeBasisPoints)
      .div(new BN(10000));

    return quoteAmountOut.sub(lpFee).sub(protocolFee).sub(coinCreatorFee);
  }

  /**
   * Get user volume accumulator info
   */
  async getUserVolumeAccumulator(user: PublicKey) {
    const userVolumeAccumulatorPda = this.getUserVolumeAccumulatorPda(user);
    try {
      return await (this.program.account as any).userVolumeAccumulator.fetch(
        userVolumeAccumulatorPda
      );
    } catch (error) {
      // Account doesn't exist yet
      return null;
    }
  }

  /**
   * Get global volume accumulator info
   */
  async getGlobalVolumeAccumulator() {
    const globalVolumeAccumulatorPda = this.getGlobalVolumeAccumulatorPda();
    try {
      return await (this.program.account as any).globalVolumeAccumulator.fetch(
        globalVolumeAccumulatorPda
      );
    } catch (error) {
      // Account doesn't exist yet
      return null;
    }
  }
}
