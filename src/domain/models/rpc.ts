export interface RpcResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface TokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export interface TokenAccountInfo {
  tokenAmount: TokenAmount;
  owner: string;
  state: string;
}

export interface ParsedAccountData {
  program: string;
  parsed: {
    info: TokenAccountInfo;
    type: string;
  };
}

export interface TokenAccount {
  account: {
    data: ParsedAccountData;
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
  };
  pubkey: string;
}

export interface AssetResponsePayload {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
}