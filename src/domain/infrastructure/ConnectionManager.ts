import {
  Connection,
  type LogsFilter,
  PublicKey,
  type Logs,
} from '@solana/web3.js';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connection: Connection | null = null;
  private subscriptionIds: Map<string, number> = new Map();

  private constructor() { }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public initialize(rpcUrl: string, websocketUrl: string): void {
    this.connection = new Connection(rpcUrl, {
      wsEndpoint: websocketUrl,
      commitment: 'confirmed',
    });
  }

  public getConnection(): Connection {
    if (!this.connection) {
      throw new Error(
        'ConnectionManager not initialized. Call initialize() first.'
      );
    }

    return this.connection;
  }

  public async subscribeTokenLogs(
    tokenMint: string,
    callback: (logs: Logs) => void
  ): Promise<void> {
    const connection = this.getConnection();

    // Unsubscribe from existing subscription for this token if it exists
    await this.unsubscribeTokenLogs(tokenMint);

    try {
      const filter: LogsFilter = new PublicKey(tokenMint);

      const subscriptionId = await connection.onLogs(
        filter,
        (logs) => {
          console.log('Received logs for token:', tokenMint, logs);
          callback(logs);
        },
        'confirmed'
      );

      this.subscriptionIds.set(tokenMint, subscriptionId);

      console.log(
        `Subscribed to logs for token ${tokenMint} with ID ${subscriptionId}`
      );
    } catch (error) {
      console.error('Error subscribing to token logs:', error);

      throw error;
    }
  }

  public async unsubscribeTokenLogs(tokenMint: string): Promise<void> {
    const connection = this.getConnection();

    const subscriptionId = this.subscriptionIds.get(tokenMint);

    if (subscriptionId !== undefined) {
      try {
        await connection.removeOnLogsListener(subscriptionId);

        this.subscriptionIds.delete(tokenMint);

        console.log(`Unsubscribed from logs for token ${tokenMint}`);
      } catch (error) {
        console.error('Error unsubscribing from token logs:', error);
      }
    }
  }

  public async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptionIds.entries()).map(
      async ([tokenMint]) => await this.unsubscribeTokenLogs(tokenMint)
    );

    await Promise.all(unsubscribePromises);

    this.subscriptionIds.clear();
  }
}
