import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Checkbox,
  App as AntdApp,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { FeedSwarmCommand } from '../../domain/commands';
import { FeedSwarmByStepsCommand } from '../../domain/commands/FeedSwarmByStepsCommand';
import type { WalletInfo } from '@/models';

interface FeedSwarmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (sourceWallet: string, amount: number) => void;
  wallets: WalletInfo[];
}

const FeedSwarmModal: React.FC<FeedSwarmModalProps> = ({
  open,
  onCancel,
  onSubmit,
  wallets,
}) => {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [useMiddleWallets, setUseMiddleWallets] = useState(false);
  const [useRandomAmount, setUseRandomAmount] = useState(false);
  const [selectedSourceWallet, setSelectedSourceWallet] = useState<string>('phantom');

  // Reset all inputs when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
      setUseMiddleWallets(false);
      setUseRandomAmount(false);
      setSelectedSourceWallet('phantom');
    }
  }, [open, form]);

  // Get available destination wallets (exclude source wallet)
  const getAvailableDestinationWallets = () => {
    return wallets.filter(wallet => wallet.publicKey !== selectedSourceWallet);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      // Get destination wallets - if none selected, use all available wallets
      const destinationWallets = values.destinationWallets && values.destinationWallets.length > 0
        ? values.destinationWallets
        : getAvailableDestinationWallets().map(wallet => wallet.publicKey);

      // Filter wallets to include only source and selected destinations
      const sourceWallet = wallets.find(w => w.publicKey === values.sourceWallet);
      const destinationWalletInfos = wallets.filter(w => destinationWallets.includes(w.publicKey));
      const filteredWallets = sourceWallet ? [sourceWallet, ...destinationWalletInfos] : destinationWalletInfos;

      const feedCommand = useMiddleWallets
        ? new FeedSwarmByStepsCommand(
            values.sourceWallet,
            values.amount,
            filteredWallets,
            values.middleWalletCount,
            values.useRandomAmount
          )
        : new FeedSwarmCommand(
            values.sourceWallet,
            values.amount,
            filteredWallets,
            values.useRandomAmount
          );

      await feedCommand.execute();

      message.success(t('swarm.feedModal.success'));

      onSubmit(values.sourceWallet, values.amount);

      form.resetFields();

      onCancel();
    } catch (error) {
      message.error(
        t('swarm.feedModal.error') + ': ' + (error as Error)?.message
      );
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
          useRandomAmount: false,
          useMiddleWallets: false,
          middleWalletCount: 5,
        }}
      >
        <Form.Item
          name="sourceWallet"
          label={t('swarm.feedModal.sourceWallet')}
          rules={[{ required: true, message: t('common.required') }]}
        >
          <Select onChange={(value) => setSelectedSourceWallet(value)}>
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
        <Form.Item
          name="destinationWallets"
          label={t('swarm.feedModal.destinationWallets')}
          extra={t('swarm.feedModal.destinationWalletsDescription')}
        >
          <Select
            mode="multiple"
            placeholder={t('swarm.feedModal.destinationWalletsPlaceholder')}
            allowClear
          >
            {getAvailableDestinationWallets().map((wallet) => (
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
          extra={t('swarm.feedModal.amountDescription')}
        >
          <InputNumber
            min={0.000001}
            max={100000}
            step={0.1}
            style={{ width: '100%' }}
            placeholder={t('swarm.feedModal.amountPlaceholder')}
          />
        </Form.Item>
        <Form.Item name="useRandomAmount" valuePropName="checked">
          <Checkbox onChange={(e) => setUseRandomAmount(e.target.checked)}>
            {t('swarm.feedModal.useRandomAmount')}
          </Checkbox>
        </Form.Item>
        <Form.Item
          name="useMiddleWallets"
          valuePropName="checked"
          extra={t('swarm.feedModal.useMiddleWalletsWarning')}
        >
          <Checkbox onChange={(e) => setUseMiddleWallets(e.target.checked)}>
            {t('swarm.feedModal.useMiddleWallets')}
          </Checkbox>
        </Form.Item>
        {useMiddleWallets && (
          <Form.Item
            name="middleWalletCount"
            label={t('swarm.feedModal.middleWalletCount')}
            rules={[{ required: true, message: t('common.required') }]}
            style={{ marginLeft: 24 }}
          >
            <InputNumber
              min={1}
              max={9}
              step={1}
              style={{ width: '100%' }}
              placeholder={t('swarm.feedModal.middleWalletCountPlaceholder')}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default FeedSwarmModal;
