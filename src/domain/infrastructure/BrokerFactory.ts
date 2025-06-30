import type { Provider } from '@coral-xyz/anchor';
import type { IBroker } from '../trading/IBroker';
import { PumpFunBroker } from '../trading/pumpfun/PumpFunBroker';
import { PUMPFUN_PROGRAM_ID } from './consts';

export class BrokerFactory {
  static create(programId: string, provider?: Provider): IBroker | null {
    switch (programId) {
      case PUMPFUN_PROGRAM_ID:
        return new PumpFunBroker(provider);
      case 'RAYDIUM_PROGRAM_ID': // Placeholder for Raydium
        throw new Error('Raydium broker not implemented');
      default:
        return null;
    }
  }
}