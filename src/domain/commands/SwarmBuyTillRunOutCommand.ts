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
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type StopSignalData } from '../infrastructure/events/types';

/**
 * Command to execute buy operations repeatedly until all wallets run out of sufficient balance
 */
export class SwarmBuyTillRunOutCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private buyAmounts: string[];
  private buyDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private computeUnitsConsumed?: number;
  private costUnits?: number;
  private componentId?: string;
  private stopped: boolean = false;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    buyAmounts: string[],
    buyDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number,
    computeUnitsConsumed?: number,
    costUnits?: number,
    componentId?: string
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.buyAmounts = buyAmounts;
    this.buyDelay = buyDelay;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;
    this.computeUnitsConsumed = computeUnitsConsumed;
    this.costUnits = costUnits;
    this.componentId = componentId;

    // Subscribe to stop events if componentId is provided
    if (this.componentId) {
      globalEventEmitter.on(
        EVENTS.StopSignal,
        this.handleStopSignal.bind(this)
      );
    }
  }

  /**
   * Handle stop signal events
   */
  private handleStopSignal(data: StopSignalData): void {
    if (
      data.componentId === this.componentId &&
      data.operation === 'buyTillRunOut'
    ) {
      console.log('🛑 Stop signal received for buy till run out operation');
      this.stopped = true;
      // Clean up event listener
      globalEventEmitter.off(
        EVENTS.StopSignal,
        this.handleStopSignal.bind(this)
      );
    }
  }

  /**
   * Get a random buy amount for a wallet, ensuring it doesn't exceed available balance
   */
  private async getRandomAmount(
    wallet: PublicKey,
    priorityFeeInSol: number
  ): Promise<number> {
    const randomIndex = Math.floor(Math.random() * this.buyAmounts.length);

    const estimatedAmount = parseFloat(this.buyAmounts[randomIndex]);

    const balance =
      (await ConnectionManager.getInstance()
        .getConnection()
        .getBalance(wallet, 'confirmed')) / LAMPORTS_PER_SOL;

    const availableBalance = balance - 2 * priorityFeeInSol - 0.0001 - 0.01;

    const amountWithSlippage = availableBalance / (1 + this.slippageBasisPoints / 10000);

    return amountWithSlippage > estimatedAmount
      ? estimatedAmount
      : amountWithSlippage;
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute buy operations repeatedly until all wallets run out of sufficient balance
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

    let roundCount = 0;
    const maxRoundCount = 10;
    const runOutWallets = new Set<string>();

    // Continue buying until all wallets run out of funds or max rounds reached
    while (true) {
      // Break if stop signal received
      if (this.stopped) {
        console.log(
          '🛑 Stop signal received. Stopping buy till run out execution.'
        );
        break;
      }

      // Break if all wallets have run out of funds
      if (runOutWallets.size === selectedWallets.length) {
        console.log(
          `🏁 All wallets have run out of funds. Stopping execution.`
        );
        break;
      }

      // Break if max round count reached
      if (roundCount >= maxRoundCount) {
        console.log(
          `🏁 Maximum round count (${maxRoundCount}) reached. Stopping execution.`
        );
        break;
      }

      roundCount++;
      console.log(`🔄 Starting buy round ${roundCount}`);

      let transactionsInRound = 0;

      for (const wallet of selectedWallets) {
        // Break if stop signal received during wallet processing
        if (this.stopped) {
          console.log('🛑 Stop signal received during wallet processing.');
          break;
        }

        // Skip wallets that have already run out of funds
        if (runOutWallets.has(wallet.keypair.publicKey.toBase58())) {
          continue;
        }
        try {
          const amountInSol = await this.getRandomAmount(
            wallet.keypair.publicKey,
            this.priorityFeeInSol
          );

          if (amountInSol <= 0) {
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

          broker
            .buy(buyParameters)
            .then((signature) => {
              console.log(
                `💰 Buy Till Run Out transaction completed for wallet ${wallet.keypair.publicKey.toBase58()} with ${amountInSol.toFixed(4)} SOL, signature:`,
                signature
              );
            })
            .catch((error) => {
              console.error(
                `❌ Buy Till Run Out transaction failed for wallet ${wallet.keypair.publicKey.toBase58()}:`,
                error
              );
            });

          transactionsInRound++;

          if (this.buyDelay > 0) {
            await this.delay(this.buyDelay * 1000); // Convert seconds to milliseconds
          }
        } catch (error) {
          console.error(
            `❌ Error processing wallet ${wallet.keypair.publicKey.toBase58()}:`,
            error
          );
          // Continue to next wallet
        }
      }

      if (transactionsInRound === 0) {
        console.log(
          '🛑 No transactions could be executed in this round, stopping.'
        );
        break;
      }

      console.log(
        `✅ Completed buy round ${roundCount} with ${transactionsInRound} transactions`
      );
    }

    console.log(`🏁 Buy Till Run Out completed after ${roundCount} rounds`);
  }
}
