import type { WalletInfo } from '@/models';
import {
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  Keypair
} from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type BalanceChangeData } from '../infrastructure/events/types';
import { getRandomRange } from '@/utils/random';
import { delay } from '@/utils/misc';
import { indexedDBManager } from '../infrastructure/templateWalletsCache';
import bs58 from 'bs58';

export class FeedSwarmByStepsCommand {
  private sourceWallet: string;
  private amount: number;
  private wallets: WalletInfo[];
  private middleWalletCount: number;
  private useRandomAmount: boolean;

  constructor(sourceWallet: string, amount: number, wallets: WalletInfo[], middleWalletCount: number, useRandomAmount: boolean = false) {
    this.sourceWallet = sourceWallet;
    this.amount = amount;
    this.wallets = wallets;
    this.middleWalletCount = middleWalletCount;
    this.useRandomAmount = useRandomAmount;
  }

  async execute(): Promise<void> {
    const totalAmount = this.amount * LAMPORTS_PER_SOL;
    
    // Start the chain transfer
    let currentSourcePublicKey: PublicKey;
    let currentSourceKeypair: Keypair | null = null;
    
    if (this.sourceWallet === 'phantom') {
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet not installed');
      }
      await window.solana.connect();
      currentSourcePublicKey = window.solana.publicKey;
      currentSourceKeypair = null; // Phantom wallet signs its own transactions
    } else {
      // Find source wallet in swarm
      const sourceWalletInfo = this.wallets.find(
        (wallet) => wallet.publicKey === this.sourceWallet
      );
      
      if (!sourceWalletInfo) {
        throw new Error('Source wallet not found in swarm');
      }
      
      currentSourcePublicKey = sourceWalletInfo.keypair.publicKey;
      currentSourceKeypair = sourceWalletInfo.keypair;
    }

    // Exclude the source wallet from destination wallets
    const destinationWallets = this.wallets.filter(
      (wallet) => wallet.publicKey !== currentSourcePublicKey.toBase58()
    );
    
    const destinationWalletCount = destinationWallets.length;

    const randoms = this.useRandomAmount
      ? getRandomRange(this.wallets.length)
      : new Array(this.wallets.length).map(() => Math.round(100 / this.wallets.length) / 100);

    const amountPerWallet = randoms.map(r => r * totalAmount);
    
    // Calculate total fees: (middleWalletCount + 1) transfers per destination wallet
    const transfersPerDestination = this.middleWalletCount + 1;
    const totalTransfers = transfersPerDestination * destinationWalletCount;
    const feePerTransaction = 5000; // 5000 lamports per transaction
    const totalFees = totalTransfers * feePerTransaction;

    // Calculate total initial amount (add total fees but subtract one fee from original source)
    const totalInitialAmount = totalAmount + totalFees - feePerTransaction;
    
    // Transfer in chain: source -> destination1 -> destination2 -> destination3...
    for (let i = 0; i < destinationWallets.length; i++) {
      const destinationWallet = destinationWallets[i];
      
      // calculate transfered amount
      let transeferedAmount = 0;

      for (let j = 0; j < i; j++){
        transeferedAmount += amountPerWallet[j];
      }

      const transferAmount = totalInitialAmount - transeferedAmount;
      
      await this.transferWithMiddleWallets(
        currentSourcePublicKey,
        destinationWallet.keypair.publicKey,
        transferAmount,
        this.middleWalletCount,
        currentSourceKeypair
      );
      
      // Update source for next iteration (destination becomes new source)
      currentSourcePublicKey = destinationWallet.keypair.publicKey;
      currentSourceKeypair = destinationWallet.keypair;
    }
  }

  private async transferWithMiddleWallets(
    sourcePublicKey: PublicKey,
    destinationPublicKey: PublicKey,
    amount: number,
    middleWalletCount: number,
    sourceKeypair?: Keypair | null
  ): Promise<void> {
    // Emit source wallet event (negative amount)
    await this.dispatchTransferEvents(sourcePublicKey, destinationPublicKey, -amount);
    
    if (middleWalletCount === 0) {
      // Direct transfer without middle wallets
      await this.directTransfer(sourcePublicKey, destinationPublicKey, amount, sourceKeypair, false);
      // Emit destination wallet event (positive amount)
      await this.dispatchTransferEvents(sourcePublicKey, destinationPublicKey, amount);
      return;
    }

    const connection = ConnectionManager.getInstance().getConnection();

    // Create middle wallets for transfer chain
    const middleWallets: Keypair[] = [];
    for (let i = 0; i < middleWalletCount; i++) {
      const keypair = Keypair.generate();
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);

      // Log to console in the requested format
      console.log(`[${publicKey}], [${privateKey}]`);

      // Add to IndexedDB
      try {
        await indexedDBManager.addWallet(publicKey, privateKey);
      } catch (error) {
        console.error('Failed to add temporary wallet to IndexedDB:', error);
      }

      middleWallets.push(keypair);
    }

    const feePerTransaction = 5000; // 5000 lamports per transaction
    
    // Transfer from source to first middle wallet (sender pays fee)
    await this.directTransfer(
      sourcePublicKey,
      middleWallets[0].publicKey,
      amount,
      sourceKeypair
    );

    // Transfer through middle wallets - each wallet transfers ALL its SOL minus 5000 lamports
    // The next wallet pays the transaction fee
    for (let i = 0; i < middleWalletCount - 1; i++) {
      // Get the current balance of the middle wallet
      const currentBalance = await connection.getBalance(middleWallets[i].publicKey);
      
      // Transfer all SOL minus 5000 lamports (for fees)
      const transferAmount = currentBalance - feePerTransaction;
      
      if (transferAmount > 0) {
        await this.directTransfer(
          middleWallets[i].publicKey,
          middleWallets[i + 1].publicKey,
          transferAmount,
          middleWallets[i]
        );
      }
    }

    // Final transfer from last middle wallet to destination
    // Transfer all remaining SOL minus 5000 lamports (destination wallet pays fee)
    const lastWalletBalance = await connection.getBalance(middleWallets[middleWalletCount - 1].publicKey);
    const finalTransferAmount = lastWalletBalance - feePerTransaction;
    
    if (finalTransferAmount > 0) {
      await this.directTransfer(
        middleWallets[middleWalletCount - 1].publicKey,
        destinationPublicKey,
        finalTransferAmount,
        middleWallets[middleWalletCount - 1],
        false // Don't emit events in directTransfer, we handle them here
      );
    }
    
    // Emit destination wallet event (positive amount)
    await this.dispatchTransferEvents(sourcePublicKey, destinationPublicKey, amount);
  }

  /**
   * Executes a direct transfer between two wallets with sender as fee payer
   * @param sourcePublicKey - The source wallet public key
   * @param destinationPublicKey - The destination wallet public key  
   * @param amount - The amount to transfer in lamports
   * @param sourceKeypair - The source wallet keypair (null for Phantom)
   * @param isFinalDestination - Whether this is a transfer to the final destination wallet
   */
  private async directTransfer(
    sourcePublicKey: PublicKey,
    destinationPublicKey: PublicKey,
    amount: number,
    sourceKeypair?: Keypair | null,
    isFinalDestination: boolean = false
  ): Promise<void> {
    const connection = ConnectionManager.getInstance().getConnection();

    // Sender is always the fee payer
    const actualFeePayer = sourcePublicKey;

    if (sourceKeypair === null) {
      // Phantom wallet case - sender pays fees
      if (!window.solana) {
        throw new Error('Phantom wallet not available');
      }
      const { blockhash } = await connection.getLatestBlockhash();
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = actualFeePayer;
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sourcePublicKey,
          toPubkey: destinationPublicKey,
          lamports: amount,
        })
      );

      await window.solana.signAndSendTransaction(transaction);
    } else {
      // Swarm wallet case - sender pays fees
      const { blockhash } = await connection.getLatestBlockhash();
      const txMessage = new TransactionMessage({
        payerKey: actualFeePayer,
        recentBlockhash: blockhash,
        instructions: [
          SystemProgram.transfer({
            fromPubkey: sourcePublicKey,
            toPubkey: destinationPublicKey,
            lamports: amount,
          })
        ],
      }).compileToV0Message();

      const tx = new VersionedTransaction(txMessage);
      const signers = [sourceKeypair].filter((signer): signer is Keypair => signer !== undefined);
      
      tx.sign(signers);

      const signature = await connection.sendTransaction(tx);

      while(1){
        await delay(500);

        const status = await connection.getSignatureStatus(signature);

        if (status?.value?.err) {
          console.log('Transaction error', status?.value?.err);

          throw new Error('Transaction error');
        }

        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
          console.log('Transaction confirmed');

          break;
        }
      }
    }
    
    // Emit balance change events only for final destination transfers
    if (isFinalDestination) {
      await this.dispatchTransferEvents(
        sourcePublicKey,
        destinationPublicKey,
        amount
      );
    }
  }

  private async dispatchTransferEvents(
    from: PublicKey,
    to: PublicKey,
    amount: number
  ): Promise<void> {
    if (amount < 0) {
      // Emit negative balance change event for source wallet
      globalEventEmitter.emit<BalanceChangeData>(
        `${EVENTS.BalanceChanged}_${from.toBase58()}`,
        {
          tokenMint: '',
          amount: amount,
          owner: from,
          source: 'transfer',
        }
      );
    } else {
      // Emit positive balance change event for destination wallet
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
  }
}