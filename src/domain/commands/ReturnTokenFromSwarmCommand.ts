import type { WalletInfo } from '@/models';
import { PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type BalanceChangeData } from '../infrastructure/events/types';
import { getTokenBalance } from '../rpc/getTokenBalance';

export class ReturnTokenFromSwarmCommand {
  private targetWallet: string;
  private wallets: WalletInfo[];
  private tokenMint: string;

  constructor(
    targetWallet: string,
    wallets: WalletInfo[],
    tokenMint: string
  ) {
    this.targetWallet = targetWallet;
    this.wallets = wallets;
    this.tokenMint = tokenMint;
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter((wallet) => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }



    // Determine target public key
    let targetPublicKey: PublicKey;
    if (this.targetWallet === 'phantom') {
      // For phantom wallet, we'll need to get the phantom wallet address
      // This is a placeholder - in a real implementation, you'd get the actual phantom wallet address
      throw new Error('Phantom wallet integration not implemented for token transfers');
    } else {
      targetPublicKey = new PublicKey(this.targetWallet);
    }

    // Get target token account
    const targetTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(this.tokenMint),
      targetPublicKey
    );

    // Execute transfers from each selected wallet
    for (const wallet of selectedWallets) {
      try {
        // Get token balance for this wallet
        const tokenBalance = await getTokenBalance(wallet.publicKey, this.tokenMint);
        
        if (tokenBalance > 0) {
          await this.executeTokenTransfer(
            wallet,
            targetTokenAccount,
            tokenBalance
          );
        } else {
          console.log(`No token balance found in wallet ${wallet.publicKey}`);
        }
      } catch (error) {
        console.error(`Failed to transfer tokens from wallet ${wallet.publicKey}:`, error);
        // Continue with other wallets even if one fails
      }
    }
  }

  private async executeTokenTransfer(
    sourceWallet: WalletInfo,
    targetTokenAccount: PublicKey,
    amount: number
  ): Promise<void> {
    const connection = ConnectionManager.getInstance().getConnection();
    
    // Get source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(this.tokenMint),
      sourceWallet.keypair.publicKey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      sourceTokenAccount,
      targetTokenAccount,
      sourceWallet.keypair.publicKey,
      BigInt(amount),
      [],
      TOKEN_PROGRAM_ID
    );

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.keypair.publicKey;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [sourceWallet.keypair],
      {
        commitment: 'confirmed',
        maxRetries: 3,
      }
    );

    console.log(`Token transfer completed with signature: ${signature}`);

    // Emit balance change events
    // Emit negative balance change for source wallet
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${sourceWallet.keypair.publicKey.toBase58()}`,
      {
        tokenMint: this.tokenMint,
        amount: -amount,
        owner: sourceWallet.keypair.publicKey,
        source: 'transfer',
      }
    );

    // Emit positive balance change for target wallet
    const targetPublicKey = new PublicKey(this.targetWallet !== 'phantom' ? this.targetWallet : this.targetWallet);
    globalEventEmitter.emit<BalanceChangeData>(
      `${EVENTS.BalanceChanged}_${targetPublicKey.toBase58()}`,
      {
        tokenMint: this.tokenMint,
        amount: amount,
        owner: targetPublicKey,
        source: 'transfer',
      }
    );
  }
}
