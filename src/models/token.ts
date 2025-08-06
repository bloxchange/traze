export interface TokenInformation {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  icon: string;
  externalUrl: string;
  // holders: number;
  // price: number;
  // volume24h: number;
  // marketCap: number;
  // lastUpdated: Date;
}

export interface TokenState {
  currentToken: TokenInformation | null;
  loading: boolean;
  error: string | null;
  totalInvestedSol: number;
  totalReservedSol: number;
  currentPrice: number;
  currentHoldAmount: number;
  bondingCompleted: boolean;
  lastUpdated: Date | null;
}
