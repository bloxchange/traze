import type { PublicKey } from '@solana/web3.js';

export interface RaydiumPoolInfo {
  id: PublicKey;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  lpMint: PublicKey;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: PublicKey;
  authority: PublicKey;
  openOrders: PublicKey;
  targetOrders: PublicKey;
  baseVault: PublicKey;
  quoteVault: PublicKey;
  withdrawQueue: PublicKey;
  lpVault: PublicKey;
  marketVersion: number;
  marketProgramId: PublicKey;
  marketId: PublicKey;
  marketAuthority: PublicKey;
  marketBaseVault: PublicKey;
  marketQuoteVault: PublicKey;
  marketBids: PublicKey;
  marketAsks: PublicKey;
  marketEventQueue: PublicKey;
}

export interface RaydiumSwapParams {
  poolKeys: RaydiumPoolInfo;
  userTokenAccountIn: PublicKey;
  userTokenAccountOut: PublicKey;
  amountIn: bigint;
  minimumAmountOut: bigint;
}

export interface PriorityFee {
  unitLimit: number;
  unitPrice: number;
}
