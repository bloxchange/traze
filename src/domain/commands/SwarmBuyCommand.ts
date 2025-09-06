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

export class SwarmBuyCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private buyAmounts: string[];
  private buyDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private computeUnitsConsumed?: number;
  private costUnits?: number;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    buyAmounts: string[],
    buyDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number,
    computeUnitsConsumed?: number,
    costUnits?: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.buyAmounts = buyAmounts;
    this.buyDelay = buyDelay;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;
    this.computeUnitsConsumed = computeUnitsConsumed;
    this.costUnits = costUnits;
  }

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

    const availableBalance = balance - priorityFeeInSol;

    return availableBalance > estimatedAmount
      ? estimatedAmount
      : availableBalance;
  }

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

    for (const wallet of selectedWallets) {
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
            // Transaction signature is now handled by logs subscription in TokenContext
            console.log(
              '💰 Buy transaction completed with signature:',
              signature
            );
          })
          .catch((error) => {
            console.error(
              `❌ Buy transaction failed for wallet ${wallet.keypair.publicKey.toBase58()}:`,
              error
            );
          });

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
  }
}
