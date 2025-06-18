import React from 'react';
import { Form, Input, Button, Checkbox, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';

export interface BuyConfigValues {
  buyAmounts: string[];
  buyDelay: number;
}

interface BuyConfigProps {
  defaultBuyAmounts: string[];
  onAmountEdit: () => void;
}

const BuySection: React.FC<BuyConfigProps> = ({ defaultBuyAmounts, onAmountEdit }) => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{t('swarm.amountInSol')}</span>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={onAmountEdit}
        />
      </div>
      <Form.Item name="buyAmounts">
        <Checkbox.Group
          options={defaultBuyAmounts.map((amount: string) => ({
            label: `${amount} SOL`,
            value: amount
          }))}
        />
      </Form.Item>
      <Form.Item
        label={t('swarm.delayInSeconds')}
        name="buyDelay"
      >
        <Input type="number" min={0} />
      </Form.Item>
    </Space>
  );
};

export default BuySection;