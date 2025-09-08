import React from 'react';
import { Form, Input, InputNumber, Button, Checkbox, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { EditOutlined } from '@ant-design/icons';

import type { SellConfigProps } from '@/models';

const SellSection: React.FC<SellConfigProps> = ({
  availablePercentages,
  defaultSellSlippage,
  defaultUseJitoBundle,
  onPercentageEdit,
}) => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <label style={{ color: 'var(--ant-form-label-color)' }}>
          {t('swarm.percentageAmount')}
        </label>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={onPercentageEdit}
          style={{ height: 'unset' }}
        />
      </div>
      <Form.Item
        name="sellPercentages"
        extra={t('swarm.percentageAmountDescription')}
      >
        <Checkbox.Group
          options={availablePercentages.map((percentage: string) => ({
            label: `${percentage}%`,
            value: percentage,
            style: { width: '80px' },
          }))}
        />
      </Form.Item>
      <Form.Item label={t('swarm.delayInSeconds')} name="sellDelay">
        <Input type="number" min={0} />
      </Form.Item>
      <Form.Item
        label={`${t('swarm.slippage')} (%)`}
        name="sellSlippage"
        initialValue={defaultSellSlippage}
      >
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          formatter={(value: number | undefined) =>
            `${value ? value / 100 : '0'}`
          }
          parser={(displayValue: string | undefined) =>
            parseFloat(displayValue || '0') * 100
          }
        />
      </Form.Item>
      <Form.Item
        name="useJitoBundle"
        valuePropName="checked"
        initialValue={defaultUseJitoBundle}
        extra={t('swarm.useJitoBundleDescription')}
      >
        <Checkbox>{t('swarm.useJitoBundle')}</Checkbox>
      </Form.Item>
    </Space>
  );
};

export default SellSection;
