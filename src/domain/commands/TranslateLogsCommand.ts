import type { Logs, TransactionError } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';

export interface TranslatedLog {
  timestamp: number;
  signature: string;
  err: TransactionError | null;
  logs: string[];
}

export class TranslateLogsCommand {
  async execute(logs: Logs): Promise<TranslatedLog> {
    const connection = ConnectionManager.getInstance().getConnection();

    const transaction = await connection.getTransaction(logs.signature, {
      maxSupportedTransactionVersion: 0,
    });

    return {
      timestamp: transaction?.blockTime ? transaction.blockTime * 1000 : Date.now(),
      signature: logs.signature,
      err: logs.err,
      logs: logs.logs || [],
    };
  }
}
