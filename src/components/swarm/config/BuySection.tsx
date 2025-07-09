import React from 'react';
import { Form, Input, Button, Checkbox, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';

import type { BuyConfigProps } from '@/models';

const BuySection: React.FC<BuyConfigProps> = ({ availableAmounts, onAmountEdit }) => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ color: 'var(--ant-form-label-color)' }}>{t('swarm.amountInSol')}</label>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={onAmountEdit}
          style={{ height: 'unset' }}
        />
      </div>
      <Form.Item name="buyAmounts" extra={t('swarm.amountInSolDescription')}>
        <Checkbox.Group
          options={availableAmounts.map((amount: string) => ({
            label: `${amount} SOL`,
            value: amount,
          }))}
        />
      </Form.Item>
      <Form.Item label={t('swarm.delayInSeconds')} name="buyDelay">
        <Input type="number" min={0} />
      </Form.Item>
    </Space>
  );
};

export default BuySection;
