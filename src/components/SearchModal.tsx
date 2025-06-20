import { Modal, Input } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicKey } from '@solana/web3.js';

interface SearchModalProps {
  open: boolean;
  onCancel: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onCancel }) => {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');

  const handleCancel = () => {
    setSearchInput('');
    onCancel();
  };

  const validatePublicKey = (value: string) => {
    try {
      if (value && value.length > 23 && value.length < 40) {
        new PublicKey(value);
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      style={{ top: 64, backgroundColor: 'transparent' }}
      closable={false}
      styles={{ content: { backgroundColor: 'transparent' } }}
    >
      <Input
        placeholder={t('search.placeholder')}
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          validatePublicKey(e.target.value);
        }}
        style={{
          width: '100%',
          height: '56px',
          borderRadius: '28px',
          fontSize: '18px',
          padding: '0 24px'
        }}
        autoFocus
        ref={(input) => setTimeout(() => input && input.focus())}
      />
    </Modal>
  );
};

export default SearchModal;