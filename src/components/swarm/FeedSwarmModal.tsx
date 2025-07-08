import React, { useState } from 'react';
import { Modal, Form, Select, InputNumber, App as AntdApp } from 'antd';
import { useTranslation } from 'react-i18next';
import { FeedSwarmCommand } from '../../domain/commands';
import type { WalletInfo } from '@/models';

interface FeedSwarmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (sourceWallet: string, amount: number) => void;
  wallets: WalletInfo[];
}

const FeedSwarmModal: React.FC<FeedSwarmModalProps> = ({ open, onCancel, onSubmit, wallets }) => {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const feedCommand = new FeedSwarmCommand(values.sourceWallet, values.amount, wallets);
      await feedCommand.execute();
      message.success(t('swarm.feedModal.success'));

      onSubmit(values.sourceWallet, values.amount);
      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(t('swarm.feedModal.error') + ': ' + (error as Error)?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('swarm.feedModal.title')}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      destroyOnHidden
      okText={t('swarm.feedModal.confirm')}
      cancelText={t('swarm.feedModal.cancel')}
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          sourceWallet: 'phantom',
          amount: 0.1,
        }}
      >
        <Form.Item
          name="sourceWallet"
          label={t('swarm.feedModal.sourceWallet')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Select>
            <Select.Option value="phantom">{t('swarm.feedModal.phantomWallet')}</Select.Option>
            {wallets.map((wallet) => (
              <Select.Option key={wallet.publicKey} value={wallet.publicKey}>
                {wallet.publicKey}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="amount"
          label={t('swarm.feedModal.amount')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <InputNumber
            min={0.000001}
            max={100000}
            step={0.1}
            style={{ width: '100%' }}
            placeholder={t('swarm.feedModal.amountPlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeedSwarmModal;
