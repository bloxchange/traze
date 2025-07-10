import React, { useState } from 'react';
import { Modal, Form, Select, App as AntdApp } from 'antd';
import { useTranslation } from 'react-i18next';
import { ReturnFromSwarmCommand } from '../../domain/commands';
import type { WalletInfo } from '../../models/wallet';

interface ReturnSwarmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (targetWallet: string) => void;
  wallets: WalletInfo[];
}

const ReturnSwarmModal: React.FC<ReturnSwarmModalProps> = ({
  open,
  onCancel,
  onSubmit,
  wallets,
}) => {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      const returnCommand = new ReturnFromSwarmCommand(
        values.targetWallet,
        wallets
      );

      await returnCommand.execute();

      onSubmit(values.targetWallet);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('swarm.returnModal.title')}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="targetWallet"
          label={t('swarm.returnModal.targetWallet')}
          rules={[{ required: true, message: t('common.validationFailed') }]}
        >
          <Select>
            <Select.Option value="phantom">
              {t('swarm.feedModal.phantomWallet')}
            </Select.Option>
            {wallets.map((wallet) => (
              <Select.Option key={wallet.publicKey} value={wallet.publicKey}>
                {wallet.publicKey}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReturnSwarmModal;
