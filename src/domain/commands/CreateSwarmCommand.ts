import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import type { WalletInfo } from '../../models/wallet';
import { getTokenBalance } from '../../domain/rpc';

export class CreateSwarmCommand {
  private privateKeys: string[];
  private generateCount: number;
  private connection: Connection;
  private tokenMint?: string;

  constructor(privateKeys: string[], generateCount: number, rpcUrl: string, tokenMint?: string) {
    if (!rpcUrl) {
      throw new Error('RPC URL is required');
    }
    this.privateKeys = privateKeys;
    this.generateCount = generateCount;
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.tokenMint = tokenMint;
  }

  async execute(): Promise<WalletInfo[]> {
    const newWallets: WalletInfo[] = [];

    // Create wallets from provided private keys
    for (const privateKey of this.privateKeys) {
      try {
        const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        const solBalance = await this.connection.getBalance(keypair.publicKey);
        let tokenBalance = 0;

        if (this.tokenMint) {
          tokenBalance = await getTokenBalance(
            this.connection,
            keypair.publicKey.toBase58(),
            this.tokenMint
          );
        }

        newWallets.push({
          publicKey: keypair.publicKey.toBase58(),
          keypair,
          solBalance: solBalance,
          tokenBalance,
          selected: false,
        });
      } catch {
        throw new Error('Invalid private key format');
      }
    }

    // Generate additional wallets if requested
    for (let i = 0; i < this.generateCount; i++) {
      const keypair = Keypair.generate();

      newWallets.push({
        publicKey: keypair.publicKey.toBase58(),
        keypair,
        solBalance: 0,
        tokenBalance: 0,
        selected: false,
      });
    }

    return newWallets;
  }
}
