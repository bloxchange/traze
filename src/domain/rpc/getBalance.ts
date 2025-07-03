import { PublicKey } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';

export async function getBalance(address: string): Promise<number> {
  const connection = ConnectionManager.getInstance().getConnection();
  return await connection.getBalance(new PublicKey(address), 'confirmed');
}
