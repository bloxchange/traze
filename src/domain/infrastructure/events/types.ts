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
  type: 'buy' | 'sell';
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
  source: 'swap' | 'transfer';
}

export interface BalanceFetchedData {
  owner: PublicKey;
  solBalance: number;
  tokenBalance: number;
  tokenMint: string;
}

export interface SwarmCreatedData {
  wallets: Array<{
    publicKey: string;
    solBalance: number;
    tokenBalance: number;
  }>;
  tokenMint: string;
}

export interface SwarmClearedData {
  walletPublicKeys: string[];
}

export interface TransactionEventData {
  signature: string;
  type: 'buy' | 'sell';
  owner: PublicKey;
}

export interface BondingCurveFetchedData {
  virtualSolReserves: bigint;
  complete: boolean;
  realSolReserves: bigint;
  virtualTokenReserves: bigint;
  realTokenReserves: bigint;
}

export interface TradeInfoFetchedData {
  tradeInfo: TradeEventData;
}

export type EventData =
  | BalanceChangeData
  | BalanceFetchedData
  | SwarmCreatedData
  | SwarmClearedData
  | TransferEventData
  | TradeEventData
  | ErrorEventData
  | TransactionEventData
  | BondingCurveFetchedData
  | TradeInfoFetchedData;
export type EventCallback<T extends EventData> = (data: T) => void;

export const EVENTS = {
  TransferSuccess: 'transferSuccess',
  TransferError: 'transferError',
  BuySuccess: 'buySuccess',
  BuyError: 'buyError',
  SellSuccess: 'sellSuccess',
  SellError: 'sellError',
  BalanceChanged: 'balanceChanged',
  BalanceFetched: 'balanceFetched',
  SwarmCreated: 'swarmCreated',
  SwarmCleared: 'swarmCleared',
  TransactionCreated: 'transactionCreated',
  BondingCurveFetched: 'bondingCurveFetched',
  TradeInfoFetched: 'tradeInfoFetched',
} as const;
