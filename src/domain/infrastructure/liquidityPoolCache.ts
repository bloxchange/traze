import type { GetProgramAccountsResponse } from '@solana/web3.js';
import { PoolAccount } from '../trading/pumpfunamm/PoolAccount';

/**
 * Interface for cached liquidity pool data
 */
interface CachedLiquidityPool {
  tokenMint: string;
  pools: PoolAccount[];
  timestamp: number;
  expiryTime: number;
}

/**
 * Utility class for managing liquidity pool cache using IndexedDB
 */
export class LiquidityPoolCache {
  private static readonly DB_NAME = 'TrazeDB';
  private static readonly STORE_NAME = 'liquidityPools';
  private static readonly DB_VERSION = 1;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(LiquidityPoolCache.DB_NAME, LiquidityPoolCache.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(LiquidityPoolCache.STORE_NAME)) {
          const store = db.createObjectStore(LiquidityPoolCache.STORE_NAME, {
            keyPath: 'tokenMint'
          });
          
          // Create index for expiry time to enable cleanup
          store.createIndex('expiryTime', 'expiryTime', { unique: false });
        }
      };
    });
  }

  /**
   * Get cached liquidity pools for a token mint
   * @param tokenMint - The token mint address
   * @returns Cached pools or null if not found or expired
   */
  async getCachedPools(tokenMint: string): Promise<PoolAccount[] | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([LiquidityPoolCache.STORE_NAME], 'readonly');
      const store = transaction.objectStore(LiquidityPoolCache.STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.get(tokenMint);
        
        request.onerror = () => {
          reject(new Error('Failed to get cached pools'));
        };
        
        request.onsuccess = () => {
          const result = request.result as CachedLiquidityPool | undefined;
          
          if (!result) {
            resolve(null);
            return;
          }
          
          // Check if cache is expired
          const now = Date.now();
          if (now > result.expiryTime) {
            // Cache expired, remove it
            this.removeCachedPools(tokenMint);
            resolve(null);
            return;
          }
          
          resolve(result.pools);
        };
      });
    } catch (error) {
      console.error('Error getting cached pools:', error);
      return null;
    }
  }

  /**
   * Cache liquidity pools for a token mint
   * @param tokenMint - The token mint address
   * @param pools - The liquidity pools to cache
   */
  async cachePools(tokenMint: string, pools: PoolAccount[]): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([LiquidityPoolCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(LiquidityPoolCache.STORE_NAME);
      
      const now = Date.now();
      
      const cachedData: CachedLiquidityPool = {
        tokenMint,
        pools,
        timestamp: now,
        expiryTime: now + LiquidityPoolCache.CACHE_DURATION
      };
      
      return new Promise((resolve, reject) => {
        const request = store.put(cachedData);
        
        request.onerror = () => {
          reject(new Error('Failed to cache pools'));
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error caching pools:', error);
    }
  }

  /**
   * Remove cached pools for a token mint
   * @param tokenMint - The token mint address
   */
  async removeCachedPools(tokenMint: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([LiquidityPoolCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(LiquidityPoolCache.STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(tokenMint);
        
        request.onerror = () => {
          reject(new Error('Failed to remove cached pools'));
        };
        
        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error removing cached pools:', error);
    }
  }

  /**
   * Clear all expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([LiquidityPoolCache.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(LiquidityPoolCache.STORE_NAME);
      const index = store.index('expiryTime');
      
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now);
      
      return new Promise((resolve, reject) => {
        const request = index.openCursor(range);
        
        request.onerror = () => {
          reject(new Error('Failed to clear expired cache'));
        };
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export a singleton instance
export const liquidityPoolCache = new LiquidityPoolCache();