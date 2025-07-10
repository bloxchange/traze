import { PublicKey } from '@solana/web3.js';
import { type TradeEventData } from '../infrastructure/events/types';
import { ConnectionManager } from '../infrastructure/ConnectionManager';

export class GetTradeInfoCommand {
  private signature: string;

  constructor(signature: string) {
    this.signature = signature;
  }

  async execute(): Promise<TradeEventData | null> {
    const connection = ConnectionManager.getInstance().getConnection();

    const transaction = await connection.getParsedTransaction(this.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });

    if (!transaction || !transaction.meta) {
      return null;
    }

    // Extract token transfer information from transaction
    const preTokenBalances = transaction.meta.preBalances;

    const postTokenBalances = transaction.meta.postBalances;

    if (preTokenBalances.length < 1 || postTokenBalances.length < 1) {
      return null;
    }

    // Get the first token balance change
    const fromBalance = preTokenBalances[0];

    const toBalance = postTokenBalances[0];

    return {
      fromTokenMint: '',
      toTokenMint: '',
      fromAccount: new PublicKey('11111111111111111111111111111111'),
      toAccount: new PublicKey('11111111111111111111111111111111'),
      fromTokenAmount: fromBalance,
      toTokenAmount: toBalance,
      timestamp: transaction.blockTime
        ? transaction.blockTime * 1000
        : Date.now(),
      status: transaction.meta.err ? 'error' : 'success',
      signature: this.signature,
      type: fromBalance > toBalance ? 'buy' : 'sell',
    };
  }
}
