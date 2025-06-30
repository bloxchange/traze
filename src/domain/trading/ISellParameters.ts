import type { Keypair, PublicKey } from "@solana/web3.js";

export interface ISellParameters {
  seller: Keypair;
  mint: PublicKey;
  sellTokenAmount: bigint;
  slippageBasisPoints: bigint;
}
