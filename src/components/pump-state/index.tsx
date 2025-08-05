import React from 'react';
import { Typography, Card, Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useToken } from '../../hooks';

const { Title } = Typography;

const PumpState: React.FC = () => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const { totalInvestedSol, totalReservedSol, currentPrice, bondingCompleted } =
    tokenState;

  return (
    <Card variant="borderless">
      <Title level={4} style={{ marginBottom: '24px' }}>
        {t('pumpState.title', 'Pump State')}
      </Title>

      <Descriptions bordered column={1}>
        <Descriptions.Item
          label={t('pumpState.totalInvestedSol', 'Total Invested SOL')}
        >
          {totalInvestedSol.toFixed(4)} SOL
        </Descriptions.Item>

        <Descriptions.Item
          label={t('pumpState.totalReservedSol', 'Total Reserved SOL')}
        >
          {totalReservedSol.toFixed(4)} SOL
        </Descriptions.Item>

        <Descriptions.Item label={t('pumpState.currentPrice', 'Current Price')}>
          {currentPrice.toFixed(8)} SOL
        </Descriptions.Item>

        <Descriptions.Item
          label={t('pumpState.bondingCompleted', 'Bonding Completed')}
        >
          <Tag color={bondingCompleted ? 'green' : 'orange'}>
            {bondingCompleted
              ? t('pumpState.completed', 'Completed')
              : t('pumpState.inProgress', 'In Progress')}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default PumpState;
