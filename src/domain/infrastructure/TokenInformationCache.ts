import type { TokenInformation } from '../../models/token';
import { DB_NAME, STORE_NAME } from './consts';

interface CachedTokenData extends TokenInformation {
  timestamp: number;
}

export class TokenInformationCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'mint' });
        }
      };
    });
  }

  async get(mint: string): Promise<TokenInformation | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(mint);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result as CachedTokenData | undefined;
        if (!data) {
          resolve(null);
          return;
        }
        const { ...tokenInfo } = data;
        resolve(tokenInfo);
      };
    });
  }

  async set(tokenInfo: TokenInformation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        ...tokenInfo,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
