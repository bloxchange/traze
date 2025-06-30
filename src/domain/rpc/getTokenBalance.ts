import { Connection, PublicKey } from '@solana/web3.js';

export async function getTokenBalance(connection: Connection, address: string, token: string): Promise<number> {
  const accounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(address),
    { mint: new PublicKey(token) },
    'confirmed'
  );
  if (accounts.value.length > 0) {
    const balance = accounts.value[0].account.data.parsed.info.tokenAmount.amount;

    return parseInt(balance);
  }
  return 0;
}