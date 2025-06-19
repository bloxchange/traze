import React from 'react';
import { Form, Input, Checkbox, Space } from 'antd';
import { useTranslation } from 'react-i18next';

import type { SellConfigProps } from '@/models';

const SellSection: React.FC<SellConfigProps> = ({ availablePercentages }) => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.Item name="sellPercentages" label={t('swarm.percentageAmount')}>
        <Checkbox.Group
          options={availablePercentages.map((percentage: string) => ({
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