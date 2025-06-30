import { Connection, PublicKey } from '@solana/web3.js';

export async function getBalance(connection: Connection, address: string): Promise<number> {
  return await connection.getBalance(new PublicKey(address), 'confirmed');
}