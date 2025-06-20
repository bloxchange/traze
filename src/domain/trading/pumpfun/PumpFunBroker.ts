import type { IBroker } from "../IBroker";
import { Program } from "@coral-xyz/anchor";
import type { PumpFun } from "./PumpFun";

/* eslint-disable */
export class PumpFunBroker implements IBroker {
  private program!: Program<PumpFun>;

  constructor(apiKey: string) {
    // TODO: Initialize program with apiKey when implementation is ready
  }

  transfer(amount: number, from: string, to: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  buy(amount: number, from: string, to: string): Promise<void> {
    throw new Error("Method not implemented.");
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