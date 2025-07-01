import React, { useState } from 'react';
import { Card, Form, Modal, Input, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import './styles.css';

import type { SwarmConfigFormValues } from '@/models';
import BuySection from './BuySection';
import SellSection from './SellSection';
import GeneralSection from './GeneralSection';

interface SwarmConfigProps {
  onConfigChange: (values: SwarmConfigFormValues) => void;
  initialConfig: SwarmConfigFormValues;
}

const SwarmConfig: React.FC<SwarmConfigProps> = ({ onConfigChange, initialConfig }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [availableBuyAmounts, setAvailableBuyAmounts] = useState(['0.1', '0.5', '1', '2', '5']);
  const availableSellPercentages = ['25', '50', '75', '100'];

  const handleAmountEdit = () => {
    setAmountInput(form.getFieldValue('buyAmounts')?.join(', ') || '');
    setIsAmountModalVisible(true);
  };

  const handleAmountSave = () => {
    const amounts = amountInput.split(',').map((amount) => amount.trim());
    setAvailableBuyAmounts(amounts);
    form.setFieldsValue({ buyAmounts: [] });
    setIsAmountModalVisible(false);
  };

  const handleValuesChange = (_: Record<string, unknown>, changedValues: SwarmConfigFormValues) => {
    const allValues = { ...initialConfig };
    onConfigChange({ ...allValues, ...changedValues });
  };

  return (
    <Card className="swarm-config" style={{ height: '100%', border: 'none' }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={initialConfig}
      >
        <Tabs
          defaultActiveKey="buy"
          className="swarm-config-tabs"
          tabBarStyle={{
            display: 'flex',
            width: '100%',
          }}
          tabBarGutter={0}
          items={[
            {
              key: 'general',
              label: t('swarm.generalTab'),
              children: <GeneralSection />,
            },
            {
              key: 'buy',
              label: t('swarm.buyTab'),
              children: (
                <BuySection
                  availableAmounts={availableBuyAmounts}
                  onAmountEdit={handleAmountEdit}
                />
              ),
            },
            {
              key: 'sell',
              label: t('swarm.sellTab'),
              children: <SellSection availablePercentages={availableSellPercentages} />,
            },
          ]}
        />
      </Form>

      <Modal
        title={t('swarm.editAmounts')}
        open={isAmountModalVisible}
        onOk={handleAmountSave}
        onCancel={() => setIsAmountModalVisible(false)}
      >
        <Input
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder={t('swarm.enterAmountsSeparatedByCommas')}
        />
      </Modal>
    </Card>
  );
};

export default SwarmConfig;
