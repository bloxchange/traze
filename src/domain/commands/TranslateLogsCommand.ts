import type { Logs, TransactionError } from '@solana/web3.js';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PUMPFUN_PROGRAM_ID } from '../infrastructure/consts';

export interface TranslatedLog {
  timestamp: number;
  signature: string;
  err: TransactionError | null;
  logs: string[];
}

export class TranslateLogsCommand {
  execute(logs: Logs): TranslatedLog {
    const borker = BrokerFactory.create(PUMPFUN_PROGRAM_ID);

    const tradeEventInfo = borker!.translateLogs(logs.logs);

    console.log(tradeEventInfo);

    return {
      timestamp: Date.now(),
      signature: logs.signature,
      err: logs.err,
      logs: logs.logs || []
    };
  }
}