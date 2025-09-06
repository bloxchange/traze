import type { WalletInfo } from '@/models';
import type { IBroker } from '../trading/IBroker';
import type { ISellParameters } from '../trading/ISellParameters';
import { BrokerFactory } from '../infrastructure/BrokerFactory';
import { PublicKey } from '@solana/web3.js';
import { ConnectionManager } from '../infrastructure/ConnectionManager';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '../infrastructure/NodeWallet';
import { getTokenBalance } from '../rpc/getTokenBalance';
import { getBrokerProgramId } from '../utils/bondingCurveUtils';
import { RaydiumLaunchPadBroker } from '../trading/raydium/RaydiumLaunchPadBroker';
import { GetTokenInformationCommand } from './GetTokenInformationCommand';
import { DEV_LAUNCHPAD_AUTH, LAUNCHPAD_AUTH } from '@raydium-io/raydium-sdk-v2';
import { globalEventEmitter } from '../infrastructure/events/EventEmitter';
import { EVENTS, type StopSignalData } from '../infrastructure/events/types';

/**
 * Command to execute sell operations repeatedly until all wallets run out of tokens
 */
export class SwarmSellTillRunOutCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private sellPercentages: string[];
  private sellDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private computeUnitsConsumed?: number;
  private costUnits?: number;
  private componentId?: string;
  private stopped: boolean = false;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    sellPercentages: string[],
    sellDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number,
    computeUnitsConsumed?: number,
    costUnits?: number,
    componentId?: string
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.sellPercentages = sellPercentages;
    this.sellDelay = sellDelay;
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
      data.operation === 'sellTillRunOut'
    ) {
      console.log('🛑 Stop signal received for sell till run out operation');
      this.stopped = true;
      // Clean up event listener
      globalEventEmitter.off(
        EVENTS.StopSignal,
        this.handleStopSignal.bind(this)
      );
    }
  }

  /**
   * Get a random sell percentage for a wallet and calculate the sell amount
   */
  private async getRandomSellAmount(wallet: PublicKey): Promise<bigint> {
    const balance = await getTokenBalance(wallet.toBase58(), this.tokenMint);

    if (balance <= 0) {
      return BigInt(0);
    }

    // If balance is less than 500,000, sell all tokens
    if (balance < 500_000_000_000) {
      return BigInt(balance);
    }

    const randomPercentage =
      this.sellPercentages[
        Math.floor(Math.random() * this.sellPercentages.length)
      ];

    const percentage = parseFloat(randomPercentage) / 100;
    const sellAmount = Math.floor(balance * percentage);

    return BigInt(sellAmount);
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

    // Continue selling until all wallets run out of tokens or max rounds reached
    while (true) {
      // Check for stop signal
      if (this.stopped) {
        console.log('🛑 Sell till run out operation stopped by user');
        break;
      }

      // Break if all wallets have run out of tokens
      if (runOutWallets.size === selectedWallets.length) {
        console.log(
          `🏁 All wallets have run out of tokens. Stopping execution.`
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
      console.log(`🔄 Starting sell round ${roundCount}`);

      let transactionsInRound = 0;

      for (const wallet of selectedWallets) {
        // Check for stop signal during wallet processing
        if (this.stopped) {
          console.log(
            '🛑 Sell till run out operation stopped by user during wallet processing'
          );
          break;
        }

        // Skip wallets that have already run out of tokens
        if (runOutWallets.has(wallet.keypair.publicKey.toBase58())) {
          continue;
        }

        try {
          const sellAmount = await this.getRandomSellAmount(
            wallet.keypair.publicKey
          );

          if (sellAmount <= 0) {
            console.log(
              `⚠️ Wallet ${wallet.keypair.publicKey.toBase58()} has no tokens to sell`
            );
            runOutWallets.add(wallet.keypair.publicKey.toBase58());
            continue;
          }

          console.log(
            `✅ Wallet ${wallet.keypair.publicKey.toBase58()} selling ${sellAmount} tokens`
          );

          const sellParameters: ISellParameters = {
            seller: wallet.keypair,
            mint: new PublicKey(this.tokenMint),
            sellTokenAmount: sellAmount,
            slippageBasisPoints: BigInt(this.slippageBasisPoints),
            priorityFeeInSol: this.priorityFeeInSol,
            maxCurrentPriorityFee: this.priorityFeeInSol,
            computeUnitsConsumed: this.computeUnitsConsumed,
            costUnits: this.costUnits,
          };

          broker
            .sell(sellParameters)
            .then((signature) => {
              console.log(
                `💸 Sell Till Run Out transaction completed for wallet ${wallet.keypair.publicKey.toBase58()} with signature:`,
                signature
              );
            })
            .catch((error) => {
              console.error(
                `❌ Sell Till Run Out transaction failed for wallet ${wallet.keypair.publicKey.toBase58()}:`,
                error
              );
            });

          transactionsInRound++;

          if (this.sellDelay > 0) {
            await this.delay(this.sellDelay * 1000); // Convert seconds to milliseconds
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
        `✅ Completed sell round ${roundCount} with ${transactionsInRound} transactions`
      );
    }

    console.log(`🏁 Sell Till Run Out completed after ${roundCount} rounds`);
  }
}
