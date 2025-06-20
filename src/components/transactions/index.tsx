import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface TransactionsProps {
  name: string;
}

const Transactions: React.FC<TransactionsProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <div>
      <Title level={4}>{name}</Title>
      <Typography.Text>{t('transactions.description')}</Typography.Text>
    </div>
  );
};

export default Transactions;