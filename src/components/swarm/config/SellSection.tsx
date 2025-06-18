import React from 'react';
import { Form, Input, Checkbox, Space } from 'antd';
import { useTranslation } from 'react-i18next';

export interface SellConfigValues {
  sellPercentages: string[];
  sellDelay: number;
}

interface SellConfigProps {
  defaultSellPercentages: string[];
}

const SellSection: React.FC<SellConfigProps> = ({ defaultSellPercentages }) => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.Item
        label={t('swarm.percentageAmount')}
        name="sellPercentages"
      >
        <Checkbox.Group
          options={defaultSellPercentages.map((percentage: string) => ({
            label: `${percentage}%`,
            value: percentage
          }))}
        />
      </Form.Item>
      <Form.Item
        label={t('swarm.delayInSeconds')}
        name="sellDelay"
      >
        <Input type="number" min={0} />
      </Form.Item>
    </Space>
  );
};

export default SellSection;