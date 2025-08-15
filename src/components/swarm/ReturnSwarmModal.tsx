import React, { useState } from 'react';
import { Modal, Form, Select, Input, App as AntdApp } from 'antd';
import { useTranslation } from 'react-i18next';
import { ReturnFromSwarmCommand } from '../../domain/commands';
import { ReturnTokenFromSwarmCommand } from '../../domain/commands/ReturnTokenFromSwarmCommand';
import type { WalletInfo } from '../../models/wallet';
import { useToken } from '../../hooks/useToken';

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
  const { tokenState } = useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      if (values.transferType === 'sol') {
        const returnCommand = new ReturnFromSwarmCommand(
          values.targetWallet,
          wallets
        );
        await returnCommand.execute();
      } else {
        // Token transfer
        if (!tokenState.currentToken?.mint) {
          throw new Error('No token selected');
        }
        const returnTokenCommand = new ReturnTokenFromSwarmCommand(
          values.targetWallet,
          wallets,
          tokenState.currentToken.mint
        );
        await returnTokenCommand.execute();
      }

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
      <Form form={form} layout="vertical" initialValues={{ transferType: 'sol' }}>
        <Form.Item
          name="transferType"
          label={t('swarm.returnModal.transferType')}
          rules={[{ required: true, message: t('common.validationFailed') }]}
        >
          <Select>
            <Select.Option value="sol">SOL</Select.Option>
            <Select.Option value="token">
              {tokenState.currentToken?.symbol || 'Token'}
            </Select.Option>
          </Select>
        </Form.Item>



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
