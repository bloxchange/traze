import type { Keypair } from '@solana/web3.js';

export interface IBuyParameters {
  buyer: Keypair;
  amountInSol: number;
  tokenMint: string;
  slippageBasisPoints: number;
  priorityFeeInSol: number;
  maxCurrentPriorityFee: number;
  computeUnitsConsumed?: number;
  costUnits?: number;
}
