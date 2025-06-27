import { Space, Switch, Select, Button, Layout, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { SettingOutlined, SearchOutlined, GiftFilled } from '@ant-design/icons';
import { Layout as FlexLayout } from 'flexlayout-react';
import ComponentList from './ComponentList';
import SearchModal from './SearchModal';
import TipModal from './TipModal';
import type { ThemeMode } from '../theme';
import { useState } from 'react';
import ConfigModal from './ConfigModal';
import { useConfiguration } from '../hooks/useConfiguration';
import type { Configuration } from '../models';

interface HeaderProps {
  theme: ThemeMode;
  flexLayoutRef: React.RefObject<FlexLayout>;
  onThemeChange: () => void;
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const Header: React.FC<HeaderProps> = ({ theme: themeMode, flexLayoutRef, onThemeChange }) => {
  const { i18n } = useTranslation();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const { configuration, updateConfiguration } = useConfiguration();
  const { token } = theme.useToken();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const handleConfigSubmit = (newConfig: Configuration) => {
    updateConfiguration(newConfig);
    setIsConfigModalOpen(false);
  };

  return (
    <Layout.Header
      style={{
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--ant-color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/traze.png" alt="Traze Logo" style={{ height: 48 }} />
        <span style={{ color: token.colorText, fontSize: 32, fontWeight: 500, lineHeight: 1 }}>traze</span>
      </div>
      <ComponentList flexLayoutRef={flexLayoutRef} />
      <Space>
        <Button type="text" icon={<SearchOutlined />} onClick={() => setIsSearchModalOpen(true)} />
        <Button type="text" icon={<SettingOutlined />} onClick={() => setIsConfigModalOpen(true)} />
        <Button
          type="text"
          icon={<GiftFilled style={{ color: token.colorPrimary }} />}
          onClick={() => setIsTipModalOpen(true)}
        />
        <Switch
          checkedChildren="🌙"
          unCheckedChildren="☀️"
          checked={themeMode === 'dark'}
          onChange={onThemeChange}
        />
        <Select value={i18n.language} onChange={handleLanguageChange} options={languageOptions} />
      </Space>
      <ConfigModal
        open={isConfigModalOpen}
        onCancel={() => setIsConfigModalOpen(false)}
        onSubmit={handleConfigSubmit}
        initialValues={configuration}
      />
      <SearchModal
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
      />
      <TipModal
        open={isTipModalOpen}
        onCancel={() => setIsTipModalOpen(false)}
      />
    </Layout.Header>
  );
};

export default Header;
