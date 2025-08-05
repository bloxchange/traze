import { Keypair } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import bs58 from 'bs58';
import type { WalletInfo } from '../../models/wallet';
import { getTokenBalance } from '../../domain/rpc';

export class CreateSwarmCommand {
  private privateKeys: string[];
  private generateCount: number;
  private tokenMint?: string;

  constructor(
    privateKeys: string[],
    generateCount: number,
    tokenMint?: string
  ) {
    this.privateKeys = privateKeys;
    this.generateCount = generateCount;
    this.tokenMint = tokenMint;
  }

  async execute(): Promise<WalletInfo[]> {
    const newWallets: WalletInfo[] = [];

    // Create wallets from provided private keys
    for (const privateKey of this.privateKeys) {
      const wallet = {} as WalletInfo;

      wallet.selected = false;

      try {
        const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

        wallet.publicKey = keypair.publicKey.toBase58();

        wallet.keypair = keypair;
      } catch {
        throw new Error('Invalid private key format');
      }

      const connection = ConnectionManager.getInstance().getConnection();

      try {
        const solBalance = await connection.getBalance(
          wallet.keypair.publicKey
        );

        wallet.solBalance = solBalance;

        let tokenBalance = 0;

        if (this.tokenMint) {
          tokenBalance = await getTokenBalance(
            wallet.publicKey,
            this.tokenMint
          );
        }

        wallet.tokenBalance = tokenBalance;
      } catch {
        wallet.solBalance = 0;

        wallet.tokenBalance = 0;
      }

      newWallets.push(wallet);
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
