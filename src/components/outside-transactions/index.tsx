import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { globalEventEmitter } from '../../domain/infrastructure/events/EventEmitter';
import {
  EVENTS,
  type TradeEventData,
  type TradeInfoFetchedData,
} from '../../domain/infrastructure/events/types';
import { formatBalance } from '../../utils/formatBalance';
import { DEFAULT_DECIMALS } from '../../domain/infrastructure/consts';
import { useToken } from '../../hooks/useToken';

interface OutsideTransactionsProps {
  name: string;
}

/**
 * Component that displays transactions from wallets that do not belong to any existing swarms.
 * Filters out transactions from wallets that are part of active swarm configurations.
 */
const OutsideTransactions: React.FC<OutsideTransactionsProps> = () => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const [transactions, setTransactions] = useState<TradeEventData[]>([]);

  useEffect(() => {
    /**
     * Handle trade info events and filter out swarm wallet transactions
     */
    const handleTradeInfoEvent = async (data: TradeInfoFetchedData) => {
      const tradeInfo = data.tradeInfo;
      const walletPublicKey = tradeInfo.fromAccount.toBase58();

      // Get all swarm wallet public keys from TokenContext
      const swarmWalletKeys = new Set(Object.keys(tokenState.wallets));

      // Only add transaction if the wallet is not part of any swarm and transaction is successful
      if (
        !swarmWalletKeys.has(walletPublicKey) &&
        tradeInfo.status === 'success'
      ) {
        setTransactions((prev) => {
          const newTransactions = [tradeInfo, ...prev];
          return newTransactions;
        });
      }
    };

    // Subscribe to trade info events
    globalEventEmitter.on<TradeInfoFetchedData>(
      EVENTS.TradeInfoFetched,
      handleTradeInfoEvent
    );

    return () => {
      globalEventEmitter.off(EVENTS.TradeInfoFetched, handleTradeInfoEvent);
    };
  }, [tokenState.wallets]);

  // Filter existing transactions when wallets change
  useEffect(() => {
    const swarmWalletKeys = new Set(Object.keys(tokenState.wallets));

    setTransactions((prev) =>
      prev.filter(
        (tx) =>
          !swarmWalletKeys.has(tx.fromAccount.toBase58()) &&
          tx.status === 'success'
      )
    );
  }, [tokenState.wallets]);

  const columns = [
    {
      title: t('outsideTransactions.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: t('outsideTransactions.type'),
      key: 'type',
      render: (_: unknown, record: TradeEventData) => (
        <span
          style={{
            color: record.type === 'buy' ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
          }}
        >
          {record.type === 'buy'
            ? t('outsideTransactions.buy')
            : t('outsideTransactions.sell')}
        </span>
      ),
    },
    {
      title: t('outsideTransactions.amount') + ' (SOL)',
      key: 'solAmount',
      render: (_: unknown, record: TradeEventData) => {
        const solAmount = Math.abs(record.fromTokenAmount) / LAMPORTS_PER_SOL;
        return (
          <span
            style={{
              color: record.type === 'buy' ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
            }}
          >
            {formatBalance(solAmount, true)}
          </span>
        );
      },
    },
    {
      title: t('outsideTransactions.tokenAmount'),
      key: 'tokenAmount',
      render: (_: unknown, record: TradeEventData) => {
        const decimals = tokenState.currentToken?.decimals || DEFAULT_DECIMALS;
        const tokenAmount =
          Math.abs(record.toTokenAmount) / Math.pow(10, decimals);
        return (
          <span
            style={{
              color: record.type === 'buy' ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
            }}
          >
            {formatBalance(tokenAmount, false)}
          </span>
        );
      },
    },
    {
      title: t('tokenInformation.marketCap'),
      key: 'marketCap',
      render: (_: unknown, record: TradeEventData) => {
        const tokenInfo = tokenState.currentToken;
        if (
          !tokenInfo ||
          !tokenState.currentPrice ||
          tokenInfo.totalSupply === 0
        ) {
          return 'N/A';
        }

        // Calculate market cap: current price * total supply
        // x 180: sol/usd
        const marketCap = tokenState.currentPrice * 180 * tokenInfo.totalSupply;

        return `${formatBalance(marketCap, true)}`;
      },
    },
    {
      title: t('outsideTransactions.wallet'),
      key: 'wallet',
      render: (_: unknown, record: TradeEventData) => {
        const walletAddress = record.fromAccount.toBase58();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'monospace' }}>
              {walletAddress.slice(0, 6)}...
            </span>
            <a
              href={`https://solscan.io/account/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1890ff',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="currentColor"
              >
                <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
            </a>
          </div>
        );
      },
    },

    {
      title: t('outsideTransactions.signature'),
      dataIndex: 'signature',
      key: 'signature',
      render: (signature: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'monospace' }}>
            {signature.slice(0, 6)}...
          </span>
          <a
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1890ff',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
          </a>
        </div>
      ),
    },
  ];

  /**
   * Calculate the total SOL amount (buy amounts - sell amounts)
   */
  const calculateTotalSol = () => {
    let buyTotal = 0;
    let sellTotal = 0;

    transactions.forEach((transaction) => {
      const solAmount =
        Math.abs(transaction.fromTokenAmount) / LAMPORTS_PER_SOL;
      if (transaction.type === 'buy') {
        buyTotal += solAmount;
      } else {
        sellTotal += solAmount;
      }
    });

    return buyTotal - sellTotal;
  };

  const totalSol = calculateTotalSol();

  return (
    <div>
      {/* Total SOL Display */}
      <div style={{ padding: '12px' }}>
        <span
          style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '8px' }}
        >
          Total SOL:
        </span>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: totalSol > 0 ? '#52c41a' : '#ff4d4f',
          }}
        >
          {totalSol > 0 ? '+' : ''}
          {formatBalance(totalSol, true)}
        </span>
      </div>

      <Table
        dataSource={transactions}
        columns={columns}
        rowKey="signature"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default OutsideTransactions;
