import React, { useState } from 'react';
import { Card, Form, Modal, Input, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

import type { BuyConfigValues } from './BuySection';
import type { SellConfigValues } from './SellSection';
import BuySection from './BuySection';
import SellSection from './SellSection';
import styles from './styles.module.css';

export interface SwarmConfigFormValues extends BuyConfigValues, SellConfigValues {}

const SwarmConfig: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [amountInput, setAmountInput] = useState('');

  const defaultBuyAmounts = ['0.1', '0.5', '1', '2', '5'];
  const defaultSellPercentages = ['25', '50', '75', '100'];

  const handleAmountEdit = () => {
    setAmountInput(form.getFieldValue('buyAmounts')?.join(', ') || defaultBuyAmounts.join(', '));
    setIsAmountModalVisible(true);
  };

  const handleAmountSave = () => {
    const amounts = amountInput.split(',').map(amount => amount.trim());
    form.setFieldsValue({ buyAmounts: amounts });
    setIsAmountModalVisible(false);
  };

  const handleValuesChange = (_: Record<string, unknown>, values: SwarmConfigFormValues) => {
    console.log('Form values:', values);
    // Implement config save logic
  };

  return (
    <Card className="swarm-config" style={{ height: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          buyAmounts: defaultBuyAmounts,
          sellPercentages: defaultSellPercentages,
          buyDelay: 0,
          sellDelay: 0
        }}
      >
        <Tabs 
            defaultActiveKey="buy"
            className={styles.equalWidthTabs}
            style={{ width: '100%' }}
            tabBarStyle={{
              display: 'flex',
              width: '100%'
            }}
            tabBarGutter={0}
            items={[
            {
              key: 'buy',
              label: t('swarm.buyTab'),
              children: (
                <BuySection 
                  defaultBuyAmounts={defaultBuyAmounts}
                  onAmountEdit={handleAmountEdit}
                />
              )
            },
            {
              key: 'sell',
              label: t('swarm.sellTab'),
              children: (
                <SellSection 
                  defaultSellPercentages={defaultSellPercentages}
                />
              )
            }
          ]}
        />
      </Form>

      <Modal
        title={t('swarm.editAmounts')}
        visible={isAmountModalVisible}
        onOk={handleAmountSave}
        onCancel={() => setIsAmountModalVisible(false)}
      >
        <Input
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          placeholder={t('swarm.enterAmounts')}
        />
      </Modal>
    </Card>
  );
};

export default SwarmConfig;