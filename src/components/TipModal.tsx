import { Modal, Input, Button, message } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      publicKey: PublicKey;
      signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
    };
  }
}
import { TIP_WALLET } from '../consts';

interface TipModalProps {
  open: boolean;
  onCancel: () => void;
}

const TipModal: React.FC<TipModalProps> = ({ open, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (!window.solana || !window.solana.isPhantom) {
        message.error(t('common.installPhantom'));
        return;
      }

      const tipAmount = parseFloat(amount);
      if (isNaN(tipAmount) || tipAmount <= 0) {
        message.error(t('tip.invalidAmount'));
        return;
      }

      // Request connection to Phantom wallet
      await window.solana.connect();

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: window.solana.publicKey,
          toPubkey: new PublicKey(TIP_WALLET),
          lamports: tipAmount * LAMPORTS_PER_SOL
        })
      );

      await window.solana.signAndSendTransaction(transaction);

      message.success(t('tip.success'));

      setAmount('');

      onCancel();
    } catch (error) {
      message.error(t('tip.error') + ': ' + (error as Error)?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('tip.send')}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {t('tip.send')}
        </Button>
      ]}
    >
      <Input
        placeholder={t('tip.enterAmount')}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        min="0"
        step="0.01"
      />
    </Modal>
  );
};

export default TipModal;