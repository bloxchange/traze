/**
 * IndexedDB utility for managing temporary wallets
 */

interface TempWallet {
  id?: number;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
}

class IndexedDBManager {
  private dbName = 'TrazeWalletDB';
  private version = 1;
  private storeName = 'tempWallets';

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create the tempWallets object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes for efficient querying
          store.createIndex('publicKey', 'publicKey', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Add a new wallet to the tempWallets collection
   */
  async addWallet(publicKey: string, privateKey: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const wallet: TempWallet = {
        publicKey,
        privateKey,
        createdAt: new Date(),
      };

      const request = store.add(wallet);

      request.onsuccess = () => {
        console.log(`[IndexedDB] Added wallet: ${publicKey}, ${privateKey}`);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to add wallet to IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  /**
   * Get all wallets from the tempWallets collection
   */
  async getAllWallets(): Promise<TempWallet[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get wallets from IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }

  /**
   * Clear all wallets from the tempWallets collection
   */
  async clearAllWallets(): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(
          '[IndexedDB] Cleared all wallets from tempWallets collection'
        );
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear wallets from IndexedDB'));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();
export type { TempWallet };
