import {
  Connection,
  PublicKey,
  type Logs,
} from '@solana/web3.js';
import { ConnectionManager } from './ConnectionManager';
import { globalEventEmitter } from './events/EventEmitter';
import { EVENTS, type MintTokenDetectedData } from './events/types';
import { BorshCoder } from '@coral-xyz/anchor';
import { IDL, type PumpFun } from '../trading/pumpfun/idl';

/**
 * Service for monitoring wallet addresses and detecting mint token events
 */
export class WalletMonitoringService {
  private static instance: WalletMonitoringService;
  private monitoredWallets: Map<string, number> = new Map(); // wallet -> subscriptionId
  private connection: Connection;
  private coder: any;

  private constructor() {
    this.connection = ConnectionManager.getInstance().getConnection();
  }

  public static getInstance(): WalletMonitoringService {
    if (!WalletMonitoringService.instance) {
      WalletMonitoringService.instance = new WalletMonitoringService();
    }
    return WalletMonitoringService.instance;
  }

  /**
   * Start monitoring a wallet address for transaction logs
   */
  public async startMonitoring(walletAddress: string): Promise<void> {
    // Stop existing monitoring for this wallet if any
    await this.stopMonitoring(walletAddress);

    try {
      const publicKey = new PublicKey(walletAddress);

      console.log(`🔍 Starting wallet monitoring for: ${walletAddress}`);

      const subscriptionId = await this.connection.onLogs(
        publicKey,
        (logs) => this.handleWalletLogs(walletAddress, logs),
        'confirmed'
      );

      this.monitoredWallets.set(walletAddress, subscriptionId);

      console.log(
        `✅ Successfully subscribed to wallet logs: ${walletAddress}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to start monitoring wallet ${walletAddress}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Stop monitoring a wallet address
   */
  public async stopMonitoring(walletAddress: string): Promise<void> {
    const subscriptionId = this.monitoredWallets.get(walletAddress);

    if (subscriptionId !== undefined) {
      try {
        await this.connection.removeOnLogsListener(subscriptionId);
        this.monitoredWallets.delete(walletAddress);

        console.log(`🛑 Stopped monitoring wallet: ${walletAddress}`);
      } catch (error) {
        console.error(
          `❌ Error stopping wallet monitoring for ${walletAddress}:`,
          error
        );
      }
    }
  }

  /**
   * Stop monitoring all wallets
   */
  public async stopAllMonitoring(): Promise<void> {
    const stopPromises = Array.from(this.monitoredWallets.keys()).map(
      (walletAddress) => this.stopMonitoring(walletAddress)
    );

    await Promise.all(stopPromises);
    this.monitoredWallets.clear();

    console.log('🛑 Stopped monitoring all wallets');
  }

  /**
   * Get list of currently monitored wallets
   */
  public getMonitoredWallets(): string[] {
    return Array.from(this.monitoredWallets.keys());
  }

  /**
   * Handle incoming wallet transaction logs
   */
  private async handleWalletLogs(
    walletAddress: string,
    logs: Logs
  ): Promise<void> {
    try {
      console.log(
        `📋 Received logs for wallet ${walletAddress}:`,
        logs.signature
      );

      // Check if this is a PumpFun transaction by looking for program invocation
      const logMessages = logs.logs;
      const pumpfunInvokeLog = logMessages.find((log: string) =>
        log.includes(
          'Program 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P invoke [1]'
        )
      );

      if (!pumpfunInvokeLog) {
        return; // Not a PumpFun transaction
      }

      // Find the first "Program data:" log after the invoke
      const programDataLog = logMessages.find((log: string) =>
        log.startsWith('Program data: ')
      );

      if (!programDataLog) {
        return; // No program data found
      }

      // Extract and decode the program data
      const base64Data = programDataLog.replace('Program data: ', '');
      const mintAddress = await this.decodePumpFunProgramData(base64Data, walletAddress);

      if (mintAddress) {
        console.log(
          `🪙 Detected mint token for wallet ${walletAddress}: ${mintAddress}`
        );

        const event: MintTokenDetectedData = {
          walletAddress,
          tokenMint: mintAddress,
          signature: logs.signature,
          timestamp: Date.now(),
        };

        console.log(`🚀 Emitting mint token detected event:`, event);
        globalEventEmitter.emit(EVENTS.MintTokenDetected, event);
      }
    } catch (error) {
      console.error(
        `❌ Error handling wallet logs for ${walletAddress}:`,
        error
      );
    }
  }

  /**
   * Decodes PumpFun program data to extract mint address using Borsch decoder
   */
  private async decodePumpFunProgramData(base64Data: string, walletAddress: string): Promise<string | null> {
    try {
      // Import the coder if not already available
      if (!this.coder) {
        this.coder = new BorshCoder(IDL as PumpFun);
      }
      
      // Try to decode as CreateEvent using Borsch decoder
      const createEvent = this.coder.events.decode(base64Data);
      
      if (createEvent && createEvent.data) {
        const data = createEvent.data;
        
        // Extract mint address from the decoded event data
        const mintAddress = data.mint?.toString();
        const creatorAddress = data.creator?.toString() || data.user?.toString();
        
        // Verify that the creator matches the monitored wallet
        if (mintAddress && creatorAddress === walletAddress) {
          console.log(`🪙 PumpFun token created: ${data.symbol || 'Unknown'} (${mintAddress}) by wallet: ${walletAddress}`);
          return mintAddress;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to decode PumpFun program data with Borsch decoder:', error);
      return null;
    }
  }
}
