import { Connection, PublicKey } from '@solana/web3.js';
import type { LogsFilter, Logs } from '@solana/web3.js';

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connection: Connection | null = null;
  private subscriptionIds: Map<string, number> = new Map();

  private constructor() { }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }

    return WebSocketManager.instance;
  }

  public initialize(httpUrl: string, websocketUrl: string): void {
    // Create new connection - old one will be garbage collected
    this.connection = new Connection(httpUrl, {
      wsEndpoint: websocketUrl,
      commitment: 'confirmed'
    });
  }

  public async subscribeTokenLogs(tokenMint: string, callback: (logs: Logs) => void): Promise<void> {
    if (!this.connection) {
      throw new Error('WebSocket connection not initialized');
    }

    // Unsubscribe from existing subscription for this token if it exists
    await this.unsubscribeTokenLogs(tokenMint);

    try {
      const filter: LogsFilter = new PublicKey(tokenMint);

      const subscriptionId = await this.connection.onLogs(
        filter,
        (logs) => {
          console.log('Received logs for token:', tokenMint, logs);
          callback(logs);
        },
        'confirmed'
      );

      this.subscriptionIds.set(tokenMint, subscriptionId);

      console.log(`Subscribed to logs for token ${tokenMint} with ID ${subscriptionId}`);
    } catch (error) {
      console.error('Error subscribing to token logs:', error);
      throw error;
    }
  }

  public async unsubscribeTokenLogs(tokenMint: string): Promise<void> {
    if (!this.connection) {
      return;
    }

    const subscriptionId = this.subscriptionIds.get(tokenMint);
    if (subscriptionId !== undefined) {
      try {
        await this.connection.removeOnLogsListener(subscriptionId);

        this.subscriptionIds.delete(tokenMint);

        console.log(`Unsubscribed from logs for token ${tokenMint}`);
      } catch (error) {
        console.error('Error unsubscribing from token logs:', error);
      }
    }
  }

  public async unsubscribeAll(): Promise<void> {
    if (!this.connection) {
      return;
    }

    const unsubscribePromises = Array.from(this.subscriptionIds.entries()).map(
      async ([tokenMint]) => await this.unsubscribeTokenLogs(tokenMint)
    );

    await Promise.all(unsubscribePromises);
    this.subscriptionIds.clear();
  }

  public disconnect(): void {
    if (this.connection) {
      this.unsubscribeAll().then(() => {
        // Connection will be garbage collected
        this.connection = null;
      });
    }
  }
}