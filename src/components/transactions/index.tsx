import React, { useState, useEffect } from 'react';
import { Typography, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { globalEventEmitter } from '../../domain/infrastructure/events/EventEmitter';
import { EVENTS, type TradeEventData } from '../../domain/infrastructure/events/types';

const { Title } = Typography;

interface TransactionsProps {
  name: string;
}

const Transactions: React.FC<TransactionsProps> = ({ name }) => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<TradeEventData[]>([]);

  useEffect(() => {
    const handleTradeEvent = (data: TradeEventData) => {
      setTransactions(prev => [data, ...prev]);
    };

    globalEventEmitter.on<TradeEventData>(EVENTS.BuySuccess, handleTradeEvent);
    globalEventEmitter.on<TradeEventData>(EVENTS.SellSuccess, handleTradeEvent);

    return () => {
      globalEventEmitter.off(EVENTS.BuySuccess, handleTradeEvent);
      globalEventEmitter.off(EVENTS.SellSuccess, handleTradeEvent);
    };
  }, []);

  const columns = [
    {
      title: t('transactions.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString()
    },
    {
      title: t('transactions.type'),
      key: 'type',
      render: (_: unknown, record: TradeEventData) => (
        record.type === 'buy' ? t('transactions.buy') : t('transactions.sell')
      ),
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
    },
    {
      title: t('transactions.signature'),
      dataIndex: 'signature',
      key: 'signature',
      render: (signature: string) => signature.slice(0, 8) + '...',
    },
  ];

  return (
    <div>
      <Title level={4}>{name}</Title>
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
