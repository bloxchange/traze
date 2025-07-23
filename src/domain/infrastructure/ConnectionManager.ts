import {
  Connection,
  type LogsFilter,
  PublicKey,
  type Logs,
} from '@solana/web3.js';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Connection[] = [];
  private currentConnectionIndex: number = 0;
  private subscriptionIds: Map<string, number> = new Map();

  private constructor() { }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public initialize(rpcUrls: string[], websocketUrl: string): void {
    // Create connections for all RPC URLs
    this.connections = rpcUrls.map(url => {
      return new Connection(url, {
        wsEndpoint: websocketUrl,
        commitment: 'confirmed',
      });
    });
  }

  public getConnection(): Connection {
    if (this.connections.length === 0) {
      throw new Error(
        'ConnectionManager not initialized. Call initialize() first.'
      );
    }

    // Round-robin selection of connection
    const connection = this.connections[this.currentConnectionIndex];

    // Update the index for the next call
    this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.connections.length;

    return connection;
  }

  public getAllConnections(): Connection[] {
    if (this.connections.length === 0) {
      throw new Error(
        'ConnectionManager not initialized. Call initialize() first.'
      );
    }

    return this.connections;
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
