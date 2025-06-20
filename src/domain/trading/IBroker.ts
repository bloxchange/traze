export interface IBroker {
  transfer(amount: number, from: string, to: string): Promise<void>;
  buy(amount: number, from: string, to: string): Promise<void>;
  sell(amount: number, from: string, to: string): Promise<void>;
  getBalance(address: string): Promise<number>;
  getPrice(symbol: string): Promise<number>;
  getTokenBalance(address: string, token: string): Promise<number>;
  swap(
    fromToken: string,
    toToken: string,
    fromAmount: number,
    toAmount: number,
    walletAddress: string
  ): Promise<void>;
}
