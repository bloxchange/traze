import { PublicKey } from '@solana/web3.js';

export interface TransferEventData {
  from: PublicKey;
  to: PublicKey;
  amount: number;
  tokenMint: string;
}

export interface TradeEventData {
  fromTokenMint: string;
  toTokenMint: string;
  fromAccount: PublicKey;
  toAccount: PublicKey;
  fromTokenAmount: number;
  toTokenAmount: number;
  timestamp: number;
  status: 'success' | 'pending' | 'error';
  signature: string;
}

export interface ErrorEventData {
  error: Error;
  tokenMint?: string;
  txId?: string;
}

export interface BalanceChangeData {
  tokenMint: string;
  amount: number;
  owner: PublicKey;
}

export type EventData = BalanceChangeData | TransferEventData | TradeEventData | ErrorEventData;
export type EventCallback<T extends EventData> = (data: T) => void;

export const EVENTS = {
  TransferSuccess: 'transferSuccess',
  TransferError: 'transferError',
  BuySuccess: 'buySuccess',
  BuyError: 'buyError',
  SellSuccess: 'sellSuccess',
  SellError: 'sellError',
  BalanceChanged: 'balanceChanged',
} as const;
