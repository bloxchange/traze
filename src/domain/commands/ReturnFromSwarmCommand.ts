import {
  PublicKey,
  SystemProgram,
  Connection,
  TransactionMessage,
  VersionedTransaction,
  type TransactionConfirmationStrategy,
} from '@solana/web3.js';
import type { WalletInfo } from '../../models';

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

    const distributorBalance = await this.connection.getBalance(distributor.keypair.publicKey);

    if (distributorBalance <= 0) {
      throw new Error('No balance to transfer');
    }

    const transferAmount = distributorBalance - 5000; // Leave some for fees
    if (transferAmount <= 0) {
      throw new Error('Insufficient balance for transfer');
    }

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();

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

    const signature = await this.connection.sendTransaction(tx);

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await this.connection.confirmTransaction(strategy);
  }

  private async executeSwarmTransfer(selectedWallet: string): Promise<void> {
    const destinationWallet = this.wallets.find((x) => x.publicKey == selectedWallet);

    if (!destinationWallet) {
      throw new Error('Destination wallet not found');
    }

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();

    const txMsg = new TransactionMessage({
      payerKey: destinationWallet.keypair.publicKey,
      recentBlockhash: blockhash,
      instructions: [],
    });

    txMsg.instructions = await Promise.all(
      this.wallets
        .filter((x) => x.publicKey !== selectedWallet)
        .map(async (wallet) => {
          const balance = await this.connection.getBalance(new PublicKey(wallet.publicKey));

          return SystemProgram.transfer({
            fromPubkey: wallet.keypair.publicKey,
            toPubkey: destinationWallet.keypair.publicKey,
            lamports: balance,
          });
        })
    );

    const compiledMsg = txMsg.compileToLegacyMessage();

    const tx = new VersionedTransaction(compiledMsg);

    tx.sign(this.wallets.map((x) => x.keypair));

    const signature = await this.connection.sendTransaction(tx);

    const strategy: TransactionConfirmationStrategy = {
      signature,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };

    await this.connection.confirmTransaction(strategy);
  }
}
