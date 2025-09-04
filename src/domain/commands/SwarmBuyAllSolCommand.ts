import type { WalletInfo } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { IBuyParameters } from '../trading/IBuyParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';
import { getBrokerProgramId } from '../utils/bondingCurveUtils';
import { RaydiumLaunchPadBroker } from '../trading/raydium/RaydiumLaunchPadBroker';
import { GetTokenInformationCommand } from './GetTokenInformationCommand';
import { LAUNCHPAD_AUTH, DEV_LAUNCHPAD_AUTH } from '@raydium-io/raydium-sdk-v2';

/**
 * Command to execute buy operations using all available SOL from each selected wallet
 */
export class SwarmBuyAllSolCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private buyDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private computeUnitsConsumed?: number;
  private costUnits?: number;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    buyDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number,
    computeUnitsConsumed?: number,
    costUnits?: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.buyDelay = buyDelay;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;
    this.computeUnitsConsumed = computeUnitsConsumed;
    this.costUnits = costUnits;
  }

  /**
   * Calculate available SOL for a wallet (minus fees and buffer for future sell)
   */
  private async getAvailableSol(
    wallet: WalletInfo,
    priorityFeeInSol: number
  ): Promise<number> {
    // Buffer for future sell operation: gas fee (0.00005 SOL) + priority fee + additional safety buffer
    const sellGasFeeBuffer = 0.00005; // DEFAULT_GAS_FEE in SOL
    const sellPriorityFeeBuffer = priorityFeeInSol; // Same priority fee for sell
    const additionalSafetyBuffer = 0.001; // Additional safety buffer
    
    const totalBuffer = priorityFeeInSol + sellGasFeeBuffer + sellPriorityFeeBuffer + additionalSafetyBuffer;
    const availableSol = (wallet.solBalance / LAMPORTS_PER_SOL) - totalBuffer;
    
    return Math.max(0, availableSol);
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute buy all SOL command for all selected wallets
   */
  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter((wallet) => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    // Get token information to check authority
    const tokenInfo = await new GetTokenInformationCommand(
      this.tokenMint
    ).execute();

    const connection = ConnectionManager.getInstance().getConnection();

    const isDevnet = connection.rpcEndpoint.includes('devnet');

    // Check if token authority is LaunchLab program to determine which broker to use
    const isLaunchLabToken =
      tokenInfo.authority ===
      (isDevnet ? DEV_LAUNCHPAD_AUTH : LAUNCHPAD_AUTH).toBase58();

    let broker: IBroker | null;

    if (isLaunchLabToken) {
      broker = new RaydiumLaunchPadBroker({
        connection,
        isDevnet: isDevnet,
      });
    } else {
      // Check bonding curve status and get appropriate broker
      const programId = await getBrokerProgramId(connection, this.tokenMint);

      // Create provider and broker based on bonding curve status
      const provider: AnchorProvider = new AnchorProvider(
        connection,
        new NodeWallet(this.wallets[0].keypair),
        {
          commitment: 'confirmed',
        }
      );

      broker = BrokerFactory.create(programId, provider);

      if (!broker) {
        throw new Error(`Failed to create broker for program ID: ${programId}`);
      }
    }

    for (const wallet of selectedWallets) {
      try {
        const amountInSol = await this.getAvailableSol(
          wallet,
          this.priorityFeeInSol
        );

        if (amountInSol <= 0) {
          console.log(`Wallet ${wallet.keypair.publicKey.toBase58()} has insufficient SOL balance`);
          continue;
        }

        const buyParameters: IBuyParameters = {
          buyer: wallet.keypair,
          tokenMint: this.tokenMint,
          amountInSol: amountInSol,
          slippageBasisPoints: this.slippageBasisPoints,
          priorityFeeInSol: this.priorityFeeInSol,
          maxCurrentPriorityFee: this.priorityFeeInSol,
          computeUnitsConsumed: this.computeUnitsConsumed,
          costUnits: this.costUnits,
        };

        broker.buy(buyParameters).then((signature) => {
          console.log(`💰 Buy All SOL transaction completed for wallet ${wallet.keypair.publicKey.toBase58()} with signature:`, signature);
        }).catch((error) => {
          console.error(`❌ Buy All SOL transaction failed for wallet ${wallet.keypair.publicKey.toBase58()}:`, error);
        });

        if (this.buyDelay > 0) {
          await this.delay(this.buyDelay * 1000); // Convert seconds to milliseconds
        }
      } catch (error) {
        console.error(`❌ Error processing wallet ${wallet.keypair.publicKey.toBase58()}:`, error);
        // Continue to next wallet
      }
    }
  }
}