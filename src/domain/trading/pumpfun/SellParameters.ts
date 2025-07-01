import type { Commitment, Finality, Keypair, PublicKey } from '@solana/web3.js';
import type { PriorityFee } from './types';
import type { ISellParameters } from '../ISellParameters';

export interface PumpFunSellParameters extends ISellParameters {
  seller: Keypair;
  mint: PublicKey;
  sellTokenAmount: bigint;
  slippageBasisPoints: bigint;
  priorityFees?: PriorityFee;
  maxCurrentPriorityFee: number;
  commitment: Commitment;
  finality: Finality;
}
