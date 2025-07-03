import type { PublicKey } from "@solana/web3.js";

export default interface TradeEventInfo {
  mint: PublicKey;
  solAmount: bigint;
  tokenAmount: bigint;
  isBuy: boolean;
  user: PublicKey;
}
