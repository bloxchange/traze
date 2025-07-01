import type { IBuyParameters } from './IBuyParameters';
import type { ISellParameters } from './ISellParameters';

export interface IBroker {
  transfer(amount: number, from: string, to: string): Promise<void>;
  buy(buyParameters: IBuyParameters): Promise<string | null>;
  sell(sellParameters: ISellParameters): Promise<string | null>;
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
  withdraw(amount: number, token: string, to: string): Promise<void>;
  jitoSell(
    sellParameters: ISellParameters[],
    jitoTipAmount: number,
    jitoUrl: string
  ): Promise<string | null>;
}
