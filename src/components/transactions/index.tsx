import React, { useState, useEffect } from 'react';
import { Typography, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { globalEventEmitter } from '../../domain/infrastructure/events/EventEmitter';
import {
  EVENTS,
  type TradeEventData,
  type TradeInfoFetchedData,
} from '../../domain/infrastructure/events/types';

const { Paragraph } = Typography;

interface TransactionsProps {
  name: string;
}

const Transactions: React.FC<TransactionsProps> = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TradeEventData[]>([]);

  useEffect(() => {
    const handleTradeInfoEvent = (data: TradeInfoFetchedData) => {
      console.log('🎯 Transaction component received TradeInfoFetched event:', data);
      setTransactions((prev) => {
        const newTransactions = [data.tradeInfo, ...prev];
        console.log('📊 Updated transactions list:', newTransactions);
        return newTransactions;
      });
    };

    console.log('🔗 Transaction component subscribing to TradeInfoFetched events');
    globalEventEmitter.on<TradeInfoFetchedData>(
      EVENTS.TradeInfoFetched,
      handleTradeInfoEvent
    );

    return () => {
      console.log('🔌 Transaction component unsubscribing from TradeInfoFetched events');
      globalEventEmitter.off(EVENTS.TradeInfoFetched, handleTradeInfoEvent);
    };
  }, []);

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
      render: (_: unknown, record: TradeEventData) =>
        record.type === 'buy' ? t('transactions.buy') : t('transactions.sell'),
    },
    {
      title: t('transactions.amount') + ' (SOL)',
      key: 'amount',
      render: (_: unknown, record: TradeEventData) => {
        const solAmount = (record.fromTokenAmount - record.toTokenAmount) / 1e9;

        return `${Math.abs(solAmount).toFixed(3)}`;
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
      <Paragraph>
        {t(
          'transactions.description',
          'This component only gets transaction updates from opening swarms.'
        )}
      </Paragraph>
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
