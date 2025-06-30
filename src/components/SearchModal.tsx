import { Modal, Input, message } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicKey } from '@solana/web3.js';
import { useToken } from '../hooks';

interface SearchModalProps {
  open: boolean;
  onCancel: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onCancel }) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const { setTokenByMint } = useToken();

  const validatePublicKey = (value: string): boolean => {
    if (!value || value.length < 20 || value.length > 44) {
      return false;
    }
    try {
      new PublicKey(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSearch = async (value: string) => {
    if (!validatePublicKey(value)) {
      message.error(t('search.invalidKey'));
      return;
    }

    try {
      await setTokenByMint(value);
      message.success(t('search.success'));
      setSearchValue('');
      onCancel();
    } catch {
      message.error(t('search.error'));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue) {
      handleSearch(searchValue);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        setSearchValue('');
        onCancel();
      }}
      footer={null}
      width={600}
      style={{ top: 64, backgroundColor: 'transparent' }}
      closable={false}
      styles={{ content: { backgroundColor: 'transparent', boxShadow: 'none' } }}
    >
      <Input
        placeholder={t('search.placeholder')}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={handleKeyPress}
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