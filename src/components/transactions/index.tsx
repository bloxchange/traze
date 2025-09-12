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
import { GetTokenInformationCommand } from '../../domain/commands/GetTokenInformationCommand';
import { DEFAULT_DECIMALS } from '../../domain/infrastructure/consts';

interface TransactionsProps {
  name: string;
}

const Transactions: React.FC<TransactionsProps> = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TradeEventData[]>([]);
  const [tokenDecimals, setTokenDecimals] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    const handleTradeInfoEvent = async (data: TradeInfoFetchedData) => {
      const tokenMint = data.tradeInfo.toTokenMint;

      // Fetch token decimals if not already cached
      if (tokenMint && !tokenDecimals[tokenMint]) {
        try {
          const tokenInfo = await new GetTokenInformationCommand(
            tokenMint
          ).execute();
          setTokenDecimals((prev) => ({
            ...prev,
            [tokenMint]: tokenInfo.decimals,
          }));
        } catch (error) {
          console.warn('Failed to get token decimals, using default:', error);
          setTokenDecimals((prev) => ({
            ...prev,
            [tokenMint]: DEFAULT_DECIMALS,
          }));
        }
      }

      setTransactions((prev) => {
        const newTransactions = [data.tradeInfo, ...prev];
        return newTransactions;
      });
    };

    globalEventEmitter.on<TradeInfoFetchedData>(
      EVENTS.TradeInfoFetched,
      handleTradeInfoEvent
    );

    return () => {
      globalEventEmitter.off(EVENTS.TradeInfoFetched, handleTradeInfoEvent);
    };
  }, [tokenDecimals]);

  const columns = [
    {
      title: t('transactions.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: t('transactions.type'),
      key: 'type',
      render: (_: unknown, record: TradeEventData) => (
        <span
          style={{
            color: record.type === 'buy' ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
          }}
        >
          {record.type === 'buy'
            ? t('transactions.buy')
            : t('transactions.sell')}
        </span>
      ),
    },
    {
      title: t('transactions.amount') + ' (SOL)',
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
      title: t('transactions.tokenAmount'),
      key: 'tokenAmount',
      render: (_: unknown, record: TradeEventData) => {
        const decimals = tokenDecimals[record.toTokenMint] || DEFAULT_DECIMALS;
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
      title: t('transactions.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          style={{
            color:
              status === 'success'
                ? 'var(--ant-color-success)'
                : 'var(--ant-color-error)',
          }}
        >
          {status}
        </span>
      ),
    },
    {
      title: t('transactions.signature'),
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

  return (
    <div>
      <Table
        dataSource={transactions}
        columns={columns}
        rowKey="signature"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Transactions;
