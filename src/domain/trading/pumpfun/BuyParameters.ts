import type { Commitment, Finality, Keypair } from "@solana/web3.js";
import type { IBuyParameters } from "../IBuyParameters";
import type { PriorityFee } from "./types";

export interface PumpFunBuyParameters extends IBuyParameters {
  buyer: Keypair,
  tokenMint: string,
  amountInSol: number,
  slippageBasisPoints: number,
  priorityFees?: PriorityFee,
  commitment: Commitment,
  finality: Finality
}
