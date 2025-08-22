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
import { LAUNCHPAD_AUTH, DEV_LAUNCHPAD_AUTH } from '@raydium-io/raydium-sdk-v2';

export class SwarmSellCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private sellPercentages: string[];
  private sellDelay: number;
  private slippageBasisPoints: number;
  private priorityFeeInSol: number;
  private computeUnitsConsumed?: number;
  private costUnits?: number;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    sellPercentages: string[],
    sellDelay: number,
    slippageBasisPoints: number,
    priorityFeeInSol: number,
    computeUnitsConsumed?: number,
    costUnits?: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.sellPercentages = sellPercentages;
    this.sellDelay = sellDelay;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;
    this.computeUnitsConsumed = computeUnitsConsumed;
    this.costUnits = costUnits;
  }

  private async calculateSellAmount(wallet: WalletInfo): Promise<bigint> {
    const balance = await getTokenBalance(wallet.publicKey, this.tokenMint);

    const percentage = this.getRandomPercentage();

    return BigInt(Math.floor((balance * percentage) / 100));
  }

  private getRandomPercentage(): number {
    const randomIndex = Math.floor(Math.random() * this.sellPercentages.length);

    return parseFloat(this.sellPercentages[randomIndex]);
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
      (isDevnet ? DEV_LAUNCHPAD_AUTH.toBase58() : LAUNCHPAD_AUTH.toBase58());

    let broker: IBroker | null = null;

    if (isLaunchLabToken) {
      console.log(
        `🔍 Using RaydiumLaunchPadBroker for LaunchLab token ${this.tokenMint}`
      );

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
          commitment: 'finalized',
        }
      );

      broker = BrokerFactory.create(programId, provider);

      if (!broker) {
        throw new Error(`Failed to create broker for program ID: ${programId}`);
      }
    }

    for (const wallet of selectedWallets) {
      const sellAmount = await this.calculateSellAmount(wallet);

      if (sellAmount <= 0) {
        continue;
      }

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

      broker.sell(sellParameters).then((signature) => {
        // Transaction signature is now handled by logs subscription in TokenContext
        console.log('💸 Sell transaction completed with signature:', signature);
      });

      if (
        this.sellDelay > 0 &&
        selectedWallets.indexOf(wallet) < selectedWallets.length - 1
      ) {
        await this.delay(this.sellDelay * 1000); // Convert seconds to milliseconds
      }
    }
  }
}
