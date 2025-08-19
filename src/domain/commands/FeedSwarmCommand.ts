import type { WalletInfo } from '@/models';
import {
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  type TransactionConfirmationStrategy,
} from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type BalanceChangeData } from '../infrastructure/events/types';
import { getRandomRange } from '@/utils/random';

export class FeedSwarmCommand {
  private sourceWallet: string;
  private amount: number;
  private wallets: WalletInfo[];
  private useRandomAmount: boolean;

  constructor(sourceWallet: string, amount: number, wallets: WalletInfo[], useRandomAmount: boolean = false) {
    this.sourceWallet = sourceWallet;
    this.amount = amount;
    this.wallets = wallets;
    this.useRandomAmount = useRandomAmount;
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

    // Create transaction
    const transaction = new Transaction();

    // Get recent blockhash
    const connection = ConnectionManager.getInstance().getConnection();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

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

    // Emit balance change events for Phantom to first wallet transfer
    await this.dispatchTransferEvents(
      window.solana.publicKey,
      this.wallets[0].keypair.publicKey,
      totalAmount
    );

    // Wait for transaction to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Then distribute from first wallet to others
    const sender = this.wallets[0];

    const remainingWallets = this.wallets.slice(1);

    const randoms = this.useRandomAmount
      ? getRandomRange(remainingWallets.length)
      : new Array(remainingWallets.length).fill(0).map(() => Math.round(100 / remainingWallets.length) / 100);

    const amountPerWallets = randoms.map(r => Math.round(r * totalAmount));

    const txMessage = new TransactionMessage({
      payerKey: sender!.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: remainingWallets.map((wallet, index) =>
        SystemProgram.transfer({
          fromPubkey: sender!.keypair.publicKey,
          toPubkey: wallet.keypair.publicKey,
          lamports: amountPerWallets[index],
        })
      ),
    }).compileToV0Message();

    const tx = new VersionedTransaction(txMessage);

    tx.sign([sender!.keypair]);

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: true,
    });

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await connection.confirmTransaction(strategy);

    // Emit balance change events for distribution to remaining wallets
    for (const wallet of remainingWallets) {
      await this.dispatchTransferEvents(
        sender.keypair.publicKey,
        wallet.keypair.publicKey,
        amountPerWallets[remainingWallets.indexOf(wallet)]
      );
    }
  }

  private async dispatchTransferEvents(
    from: PublicKey,
    to: PublicKey,
    amount: number
  ): Promise<void> {
    // Emit balance change event for source wallet (negative amount)
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${from.toBase58()}`,
      {
        tokenMint: '',
        amount: -amount,
        owner: from,
        source: 'transfer',
      }
    );

    // Emit balance change event for destination wallet (positive amount)
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${to.toBase58()}`,
      {
        tokenMint: '',
        amount: amount,
        owner: to,
        source: 'transfer',
      }
    );
  }

  private async executeSwarmTransfer(): Promise<void> {
    const sender = this.wallets.find(
      (wallet) => wallet.publicKey === this.sourceWallet
    );

    const remainingWallets = this.wallets.filter(
      (wallet) => wallet.publicKey !== this.sourceWallet
    );

    const randoms = this.useRandomAmount
      ? getRandomRange(remainingWallets.length)
      : new Array(remainingWallets.length).fill(0).map(() => Math.round(100 / remainingWallets.length) / 100);

    const amountPerWallet = randoms.map(r => Math.round(r * this.amount * LAMPORTS_PER_SOL));

    const connection = ConnectionManager.getInstance().getConnection();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const txMessage = new TransactionMessage({
      payerKey: sender!.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: remainingWallets.map((wallet, index) =>
        SystemProgram.transfer({
          fromPubkey: sender!.keypair.publicKey,
          toPubkey: wallet.keypair.publicKey,
          lamports: amountPerWallet[index],
        })
      ),
    }).compileToV0Message();

    const tx = new VersionedTransaction(txMessage);

    tx.sign([sender!.keypair]);

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: true,
    });

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await connection.confirmTransaction(strategy);

    // Emit balance change events for each recipient
    for (const wallet of remainingWallets) {
      await this.dispatchTransferEvents(
        sender!.keypair.publicKey,
        wallet.keypair.publicKey,
        amountPerWallet[remainingWallets.indexOf(wallet)]
      );
    }
  }
}
