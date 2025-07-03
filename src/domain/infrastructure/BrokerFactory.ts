import type { Provider } from '@coral-xyz/anchor';
import type { IBroker } from '../trading/IBroker';
import { PumpFunBroker } from '../trading/pumpfun/PumpFunBroker';
import { PUMPFUN_PROGRAM_ID } from './consts';

export class BrokerFactory {
  private static instances = new Map<string, IBroker>();

  static create(programId: string, provider?: Provider): IBroker | null {
    if (this.instances.has(programId)) {
      return this.instances.get(programId)!;
    }

    let broker: IBroker | null = null;
    switch (programId) {
      case PUMPFUN_PROGRAM_ID:
        broker = new PumpFunBroker(provider);
        break;
      case 'RAYDIUM_PROGRAM_ID': // Placeholder for Raydium
        throw new Error('Raydium broker not implemented');
      default:
        return null;
    }

    if (broker) {
      this.instances.set(programId, broker);
    }
    return broker;
  }
}
