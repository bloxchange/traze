import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import type { WalletInfo } from '../../models/wallet';

export class ReturnFromSwarmCommand {
  private targetWallet: string;
  private wallets: WalletInfo[];
  private connection: Connection;

  constructor(targetWallet: string, wallets: WalletInfo[], rpcUrl: string) {
    this.targetWallet = targetWallet;
    this.wallets = wallets;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async execute(): Promise<void> {
    if (this.targetWallet === 'phantom') {
      await this.executePhantomTransfer();
    } else {
      await this.executeSwarmTransfer();
    }
  }

  private async executePhantomTransfer(): Promise<void> {
    // Implementation for Phantom wallet transfer
    throw new Error('Phantom wallet transfer not implemented');
  }

  private async executeSwarmTransfer(): Promise<void> {
    const targetPublicKey = new PublicKey(this.targetWallet);

    for (const wallet of this.wallets) {
      if (!wallet.selected) continue;

      const balance = await this.connection.getBalance(new PublicKey(wallet.publicKey));
      if (balance <= 0) continue;

      const transaction = new Transaction();
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(wallet.publicKey);

      // Leave some SOL for fees
      const transferAmount = balance - 0.001 * LAMPORTS_PER_SOL;
      if (transferAmount <= 0) continue;

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.publicKey),
          toPubkey: targetPublicKey,
          lamports: transferAmount
        })
      );

      transaction.sign(wallet.keypair);
      await this.connection.sendTransaction(transaction, [wallet.keypair]);
    }
  }
}