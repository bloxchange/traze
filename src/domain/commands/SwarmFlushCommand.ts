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

export class SwarmFlushCommand {
  private wallets: WalletInfo[];
  private tokenMint: string;
  private slippageBasisPoints: bigint;
  private priorityFeeInSol: number;
  private computeUnitsConsumed?: number;
  private costUnits?: number;

  constructor(
    wallets: WalletInfo[],
    tokenMint: string,
    slippageBasisPoints: bigint,
    priorityFeeInSol: number,
    computeUnitsConsumed?: number,
    costUnits?: number
  ) {
    this.wallets = wallets;
    this.tokenMint = tokenMint;
    this.slippageBasisPoints = slippageBasisPoints;
    this.priorityFeeInSol = priorityFeeInSol;
    this.computeUnitsConsumed = computeUnitsConsumed;
    this.costUnits = costUnits;
  }

  private async calculateSellAmount(wallet: WalletInfo): Promise<bigint> {
    return BigInt(await getTokenBalance(wallet.publicKey, this.tokenMint));
  }

  async execute(): Promise<void> {
    const selectedWallets = this.wallets.filter((wallet) => wallet.selected);

    if (selectedWallets.length === 0) {
      throw new Error('No wallets selected');
    }

    // Get connection instance
    const connection = ConnectionManager.getInstance().getConnection();

    const isDevnet = connection.rpcEndpoint.includes('devnet');

    // Get token information to check authority
    const tokenInfo = await new GetTokenInformationCommand(
      this.tokenMint
    ).execute();

    // Check if token authority is LaunchLab program to determine which broker to use
    const isLaunchLabToken =
      tokenInfo.authority ===
      (isDevnet ? DEV_LAUNCHPAD_AUTH : LAUNCHPAD_AUTH).toBase58();

    let broker: IBroker | null;

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

    // const prioritizationFees = await connection.getRecentPrioritizationFees({
    //   lockedWritableAccounts: [new PublicKey(this.tokenMint)],
    // });

    // let maxCurrentPriorityUnitPrice = 0;

    // prioritizationFees.forEach(
    //   ({ prioritizationFee }: { prioritizationFee: number }) => {
    //     if (prioritizationFee > maxCurrentPriorityUnitPrice) {
    //       maxCurrentPriorityUnitPrice = prioritizationFee;
    //     }
    //   }
    // );

    // Get all token balances for selected wallets
    const walletsWithBalances = await Promise.all(
      selectedWallets.map(async (wallet) => {
        //const balance = await this.calculateSellAmount(wallet);

        const balance = BigInt(wallet.tokenBalance);

        return { wallet, balance };
      })
    );

    // Filter out wallets with zero balance and sort by balance (largest to smallest)
    const walletsToSell = walletsWithBalances
      .filter(({ balance }) => balance > 0)
      .sort((a, b) => {
        // Sort in descending order (largest balance first)
        if (a.balance > b.balance) return -1;

        if (a.balance < b.balance) return 1;

        return 0;
      });

    // Execute sell instructions in order from largest to smallest balance
    //for (const { wallet, balance } of walletsToSell) {
    for (let i = 0; i < walletsToSell.length; i++) {
      try {
        const { wallet, balance } = walletsToSell[i];

        console.log(
          `💰 Selling ${balance} tokens from wallet ${wallet.publicKey}`
        );

        const sellParameters: ISellParameters = {
          seller: wallet.keypair,
          mint: new PublicKey(this.tokenMint),
          sellTokenAmount: balance,
          slippageBasisPoints: BigInt(9999),
          priorityFeeInSol: this.priorityFeeInSol * (i === 0 ? 2 : 1),
          maxCurrentPriorityFee: this.priorityFeeInSol,
          computeUnitsConsumed: this.computeUnitsConsumed,
          costUnits: this.costUnits,
        };

        broker
          .sell(sellParameters)
          .then((signature) => {
            // Transaction signature is handled by logs subscription in TokenContext
            console.log(
              `💸 Flush transaction completed for wallet ${wallet.publicKey} with signature:`,
              signature
            );
          })
          .catch((error) => {
            console.error(
              `❌ Flush transaction failed for wallet ${wallet.publicKey}:`,
              error
            );
          });
      } catch (error) {
        const { wallet } = walletsToSell[i];
        console.error(`❌ Error processing wallet ${wallet.publicKey}:`, error);
        // Continue to next wallet
      }
    }
  }
}
