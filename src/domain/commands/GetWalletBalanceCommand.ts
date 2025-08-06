import { PublicKey } from '@solana/web3.js';
import { getBalance } from '../rpc/getBalance';
import { getTokenBalance } from '../rpc/getTokenBalance';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type BalanceFetchedData } from '../infrastructure/events/types';

export class GetWalletBalanceCommand {
  private walletAddress: string;
  private tokenMint: string;

  constructor(walletAddress: string, tokenMint: string) {
    this.walletAddress = walletAddress;
    this.tokenMint = tokenMint;
  }

  async execute(): Promise<void> {
    try {
      // Fetch both SOL and token balances concurrently
      const [solBalance, tokenBalance] = await Promise.all([
        getBalance(this.walletAddress),
        getTokenBalance(this.walletAddress, this.tokenMint),
      ]);

      // Emit the BalanceFetchedEvent with exact balance values
      const eventData: BalanceFetchedData = {
        owner: new PublicKey(this.walletAddress),
        solBalance,
        tokenBalance,
        tokenMint: this.tokenMint,
      };

      const eventName = `${EVENTS.BalanceFetched}_${this.walletAddress}`;
      globalEventEmitter.emit<BalanceFetchedData>(eventName, eventData);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      throw error;
    }
  }
}