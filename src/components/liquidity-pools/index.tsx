import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface LiquidityPoolsProps {
  name: string;
}

const LiquidityPools: React.FC<LiquidityPoolsProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <div>
      <Title level={4}>{name}</Title>
      <Typography.Text>{t('liquidityPools.description')}</Typography.Text>
    </div>
  );
};

export default LiquidityPools;
