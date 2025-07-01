import type { WalletInfo } from '@/models';
import {
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  type TransactionConfirmationStrategy,
} from '@solana/web3.js';

export class FeedSwarmCommand {
  private sourceWallet: string;
  private amount: number;
  private wallets: WalletInfo[];
  private connection: Connection;

  constructor(sourceWallet: string, amount: number, wallets: WalletInfo[], rpcUrl: string) {
    this.sourceWallet = sourceWallet;
    this.amount = amount;
    this.wallets = wallets;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async execute(): Promise<void> {
    if (this.sourceWallet === 'phantom') {
      await this.executePhantomTransfer();
    } else {
      await this.executeSwarmTransfer();
    }
  }

  private async executePhantomTransfer(): Promise<void> {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }

    // Connect to Phantom wallet
    await window.solana.connect();

    // For Phantom wallet, first transfer total amount to first wallet
    const totalAmount = this.amount * LAMPORTS_PER_SOL;
    const amountPerWallet = totalAmount / this.wallets.length;

    // Create transaction
    const transaction = new Transaction();

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = window.solana.publicKey;

    // Transfer total amount to first wallet
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: window.solana.publicKey,
        toPubkey: this.wallets[0].keypair.publicKey,
        lamports: totalAmount,
      })
    );

    await window.solana.signAndSendTransaction(transaction);

    // Wait for transaction to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Then distribute from first wallet to others
    const sender = this.wallets[0];
    const remainingWallets = this.wallets.slice(1);

    const txMessage = new TransactionMessage({
      payerKey: sender!.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: remainingWallets.map((wallet) =>
        SystemProgram.transfer({
          fromPubkey: sender!.keypair.publicKey,
          toPubkey: wallet.keypair.publicKey,
          lamports: amountPerWallet,
        })
      ),
    }).compileToV0Message();

    const tx = new VersionedTransaction(txMessage);

    tx.sign([sender!.keypair]);

    const signature = await this.connection.sendTransaction(tx);

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await this.connection.confirmTransaction(strategy);
  }

  private async executeSwarmTransfer(): Promise<void> {
    const sender = this.wallets.find((wallet) => wallet.publicKey === this.sourceWallet);
    const remainingWallets = this.wallets.filter(
      (wallet) => wallet.publicKey !== this.sourceWallet
    );
    const amountPerWallet = (this.amount * LAMPORTS_PER_SOL) / remainingWallets.length;

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();

    const txMessage = new TransactionMessage({
      payerKey: sender!.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: remainingWallets.map((wallet) =>
        SystemProgram.transfer({
          fromPubkey: sender!.keypair.publicKey,
          toPubkey: wallet.keypair.publicKey,
          lamports: amountPerWallet,
        })
      ),
    }).compileToV0Message();

    const tx = new VersionedTransaction(txMessage);

    tx.sign([sender!.keypair]);

    const signature = await this.connection.sendTransaction(tx);

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await this.connection.confirmTransaction(strategy);
  }
}
