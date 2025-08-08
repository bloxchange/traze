import { struct, u8, u16, u64, publicKey, type Layout } from '@coral-xyz/borsh';
import { PublicKey } from '@solana/web3.js';

export class PoolAccount {
  public poolBump: number;
  public index: number;
  public creator: PublicKey;
  public baseMint: PublicKey;
  public quoteMint: PublicKey;
  public lpMint: PublicKey;
  public poolBaseTokenAccount: PublicKey;
  public poolQuoteTokenAccount: PublicKey;
  public lpSupply: bigint;

  constructor(
    poolBump: number,
    index: number,
    creator: PublicKey,
    baseMint: PublicKey,
    quoteMint: PublicKey,
    lpMint: PublicKey,
    poolBaseTokenAccount: PublicKey,
    poolQuoteTokenAccount: PublicKey,
    lpSupply: bigint
  ) {
    this.poolBump = poolBump;
    this.index = index;
    this.creator = creator;
    this.baseMint = baseMint;
    this.quoteMint = quoteMint;
    this.lpMint = lpMint;
    this.poolBaseTokenAccount = poolBaseTokenAccount;
    this.poolQuoteTokenAccount = poolQuoteTokenAccount;
    this.lpSupply = lpSupply;
  }

  public static fromBuffer(buffer: Buffer): PoolAccount {
    const structure: Layout<PoolAccount> = struct([
      u8('poolBump'),
      u16('index'),
      publicKey('creator'),
      publicKey('baseMint'),
      publicKey('quoteMint'),
      publicKey('lpMint'),
      publicKey('poolBaseTokenAccount'),
      publicKey('poolQuoteTokenAccount'),
      u64('lpSupply'),
    ]);

    const value = structure.decode(buffer);

    return new PoolAccount(
      value.poolBump,
      value.index,
      value.creator,
      value.baseMint,
      value.quoteMint,
      value.lpMint,
      value.poolBaseTokenAccount,
      value.poolQuoteTokenAccount,
      BigInt(value.lpSupply)
    );
  }
}
