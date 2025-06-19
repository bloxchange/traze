import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import type { WalletInfo } from '../../models/wallet';

export class CreateSwarmCommand {
  private privateKeys: string[];
  private generateCount: number;

  constructor(privateKeys: string[], generateCount: number) {
    this.privateKeys = privateKeys;
    this.generateCount = generateCount;
  }

  execute(): WalletInfo[] {
    const newWallets: WalletInfo[] = [];

    // Create wallets from provided private keys
    this.privateKeys.forEach(privateKey => {
      try {
        const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        newWallets.push({
          publicKey: keypair.publicKey.toBase58(),
          keypair,
          solBalance: 0,
          tokenBalance: 0,
          selected: false
        });
      } catch {
        throw new Error('Invalid private key format');
      }
    });

    // Generate additional wallets if requested
    for (let i = 0; i < this.generateCount; i++) {
      const keypair = Keypair.generate();
      newWallets.push({
        publicKey: keypair.publicKey.toBase58(),
        keypair,
        solBalance: 0,
        tokenBalance: 0,
        selected: false
      });
    }

    return newWallets;
  }
}