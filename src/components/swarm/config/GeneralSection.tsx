import React from 'react';
import { Form, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import type { GeneralConfigProps } from '@/models';

const GeneralSection: React.FC<GeneralConfigProps> = ({
  defaultSlippage,
  defaultPriorityFee,
  defaultJitoTipAmount,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="general-section"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
    >
      <Form.Item
        label={`${t('swarm.slippage')} (%)`}
        name="slippageBasisPoints"
        initialValue={defaultSlippage}
      >
        <InputNumber
          min={0}
          precision={2}
          style={{ width: '100%' }}
          formatter={(value: number | undefined) => `${value ? value / 100 : '0'}`}
          parser={(displayValue: string | undefined) => parseFloat(displayValue || '0') * 100}
        />
      </Form.Item>

      <Form.Item
        label={`${t('swarm.priorityFee')} (SOL)`}
        name="priorityFee"
        initialValue={defaultPriorityFee}
      >
        <InputNumber min={0} step={0.001} precision={4} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label={`${t('swarm.jitoTipAmount')} (SOL)`}
        name="jitoTipAmount"
        initialValue={defaultJitoTipAmount}
      >
        <InputNumber min={0} step={0.001} precision={4} style={{ width: '100%' }} />
      </Form.Item>
    </div>
  );
};

export default GeneralSection;
