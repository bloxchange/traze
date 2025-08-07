import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  type TransactionConfirmationStrategy,
} from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import type { WalletInfo } from '../../models';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type BalanceChangeData } from '../infrastructure/events/types';

export class ReturnFromSwarmCommand {
  private targetWallet: string;
  private wallets: WalletInfo[];

  constructor(targetWallet: string, wallets: WalletInfo[]) {
    this.targetWallet = targetWallet;
    this.wallets = wallets;
  }

  async execute(): Promise<void> {
    if (this.targetWallet === 'phantom') {
      await this.executePhantomTransfer();
    } else {
      await this.executeSwarmTransfer(this.targetWallet);
    }
  }

  private async executePhantomTransfer(): Promise<void> {
    if (!window.solana || !window.solana.isPhantom) {
      throw new Error('Phantom wallet not installed');
    }

    // Connect to Phantom wallet
    await window.solana.connect();

    // First, consolidate funds from selected wallets to the first selected wallet
    await this.executeSwarmTransfer(this.wallets[0].publicKey);

    // Wait for transaction to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Now transfer consolidated balance from distributor to Phantom
    const distributor = this.wallets[0];

    const connection = ConnectionManager.getInstance().getConnection();

    const distributorBalance = await connection.getBalance(
      distributor.keypair.publicKey
    );

    if (distributorBalance <= 0) {
      throw new Error('No balance to transfer');
    }

    const transferAmount = distributorBalance - 5000; // Leave some for fees

    if (transferAmount <= 0) {
      throw new Error('Insufficient balance for transfer');
    }
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const txMessage = new TransactionMessage({
      payerKey: distributor.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: [
        SystemProgram.transfer({
          fromPubkey: distributor.keypair.publicKey,
          toPubkey: window.solana.publicKey,
          lamports: transferAmount,
        }),
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(txMessage);

    tx.sign([distributor.keypair]);

    const signature = await connection.sendTransaction(tx);

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await connection.confirmTransaction(strategy);

    await this.dispatchTransferEvents(
      distributor.keypair.publicKey,
      window.solana.publicKey,
      transferAmount
    );
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

  private async executeSwarmTransfer(selectedWallet: string): Promise<void> {
    const destinationWallet = this.wallets.find(
      (x) => x.publicKey == selectedWallet
    );

    if (!destinationWallet) {
      throw new Error('Destination wallet not found');
    }

    const connection = ConnectionManager.getInstance().getConnection();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const txMsg = new TransactionMessage({
      payerKey: destinationWallet.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: [],
    });

    const sourceWallets = this.wallets.filter(
      (x) => x.publicKey !== selectedWallet
    );

    const transferInstructions = await Promise.all(
      sourceWallets.map(async (wallet) => {
        const balance = await connection.getBalance(
          new PublicKey(wallet.publicKey)
        );
        return {
          instruction: SystemProgram.transfer({
            fromPubkey: wallet.keypair.publicKey,
            toPubkey: destinationWallet.keypair.publicKey,
            lamports: balance,
          }),
          amount: balance,
          from: wallet.keypair.publicKey,
        };
      })
    );

    txMsg.instructions = transferInstructions.map((x) => x.instruction);

    const compiledMsg = txMsg.compileToLegacyMessage();

    const tx = new VersionedTransaction(compiledMsg);

    tx.sign(this.wallets.map((x) => x.keypair));

    const signature = await connection.sendTransaction(tx);

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await connection.confirmTransaction(strategy);

    // Emit transfer events for each source wallet
    for (const transfer of transferInstructions) {
      await this.dispatchTransferEvents(
        transfer.from,
        destinationWallet.keypair.publicKey,
        transfer.amount
      );
    }
  }
}
