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

    // Extract SOL balance changes (index 0 is usually the user's SOL account)
    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    
    // Extract token balance changes
    const preTokenBalances = transaction.meta.preTokenBalances;
    const postTokenBalances = transaction.meta.postTokenBalances;

    if (preBalances.length < 1 || postBalances.length < 1 || 
        !preTokenBalances || !postTokenBalances || 
        preTokenBalances.length < 2 || postTokenBalances.length < 2) {
      return null;
    }

    // Calculate SOL amount spent/received (fromTokenAmount)
    const solBalanceBefore = preBalances[0];
    const solBalanceAfter = postBalances[0];
    const fromTokenAmount = Math.abs(solBalanceBefore - solBalanceAfter);

    // Calculate token amount received/sold (toTokenAmount)
    // Index 1 is typically the token account
    const tokenBalanceBefore = preTokenBalances[1]?.uiTokenAmount?.amount;
    const tokenBalanceAfter = postTokenBalances[1]?.uiTokenAmount?.amount;
    
    if (!tokenBalanceBefore || !tokenBalanceAfter) {
      return null;
    }
    
    const toTokenAmount = Math.abs(parseFloat(tokenBalanceAfter) - parseFloat(tokenBalanceBefore));

    return {
      fromTokenMint: '',
      toTokenMint: '',
      fromAccount: new PublicKey('11111111111111111111111111111111'),
      toAccount: new PublicKey('11111111111111111111111111111111'),
      fromTokenAmount: fromTokenAmount,
      toTokenAmount: toTokenAmount,
      timestamp: transaction.blockTime
        ? transaction.blockTime * 1000
        : Date.now(),
      status: transaction.meta.err ? 'error' : 'success',
      signature: this.signature,
      type: solBalanceBefore > solBalanceAfter ? 'buy' : 'sell',
    };
  }
}
