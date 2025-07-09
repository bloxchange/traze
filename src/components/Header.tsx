import { Space, Switch, Select, Button, Layout, theme, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  SettingOutlined,
  SearchOutlined,
  GiftFilled,
  QuestionCircleOutlined,
  ReadOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { MapOutlined } from './icons';
import { Layout as FlexLayout } from 'flexlayout-react';
import ComponentList from './ComponentList';
import SearchModal from './SearchModal';
import TipModal from './TipModal';
import FaqModal from './FaqModal';
import { RoadMapModal } from './RoadMapModal';
import ManualModal from './ManualModal';
import ContactModal from './ContactModal';
import type { ThemeMode } from '../theme';
import { useState } from 'react';
import ConfigModal from './ConfigModal';
import { useConfiguration } from '../hooks/useConfiguration';
import type { Configuration } from '../models';
import { CURRENT_VERSION } from '../consts';

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
  const { t, i18n } = useTranslation();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isRoadMapModalOpen, setIsRoadMapModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <img src="/traze.png" alt="Traze Logo" style={{ height: 48 }} />
        <span
          style={{
            color: token.colorText,
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1,
            marginLeft: 8,
          }}
        >
          traze
        </span>
        <span style={{ fontSize: 10, color: token.colorTextDescription, paddingTop: 20 }}>
          {CURRENT_VERSION}
        </span>
      </div>
      <ComponentList flexLayoutRef={flexLayoutRef} />
      <Space>
        <Tooltip title={t('common.tooltips.contact')}>
          <Button
            type="text"
            icon={<MessageOutlined />}
            onClick={() => setIsContactModalOpen(true)}
          />
        </Tooltip>
        <Tooltip title={t('common.tooltips.manual')}>
          <Button type="text" icon={<ReadOutlined />} onClick={() => setIsManualModalOpen(true)} />
        </Tooltip>
        <Tooltip title={t('common.tooltips.roadmap')}>
          <Button type="text" icon={<MapOutlined />} onClick={() => setIsRoadMapModalOpen(true)} />
        </Tooltip>
        <Tooltip title={t('common.tooltips.faq')}>
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={() => setIsFaqModalOpen(true)}
          />
        </Tooltip>
        <Tooltip title={t('common.tooltips.search')}>
          <Button
            type="text"
            icon={<SearchOutlined />}
            onClick={() => setIsSearchModalOpen(true)}
          />
        </Tooltip>
        <Tooltip title={t('common.tooltips.settings')}>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setIsConfigModalOpen(true)}
          />
        </Tooltip>
        <Tooltip title={t('common.tooltips.sendTip')}>
          <Button
            type="text"
            icon={<GiftFilled style={{ color: token.colorPrimary }} />}
            onClick={() => setIsTipModalOpen(true)}
          />
        </Tooltip>
        <Tooltip
          title={t(
            themeMode === 'dark'
              ? 'common.tooltips.switchTheme.toLight'
              : 'common.tooltips.switchTheme.toDark'
          )}
        >
          <Switch
            checkedChildren="🌙"
            unCheckedChildren="☀️"
            checked={themeMode === 'dark'}
            onChange={onThemeChange}
          />
        </Tooltip>
        <Tooltip title={t('common.tooltips.changeLanguage')}>
          <Select value={i18n.language} onChange={handleLanguageChange} options={languageOptions} />
        </Tooltip>
      </Space>
      <ConfigModal
        open={isConfigModalOpen}
        onCancel={() => setIsConfigModalOpen(false)}
        onSubmit={handleConfigSubmit}
        initialValues={configuration}
      />
      <SearchModal open={isSearchModalOpen} onCancel={() => setIsSearchModalOpen(false)} />
      <TipModal open={isTipModalOpen} onCancel={() => setIsTipModalOpen(false)} />
      <FaqModal open={isFaqModalOpen} onCancel={() => setIsFaqModalOpen(false)} />
      <RoadMapModal open={isRoadMapModalOpen} onClose={() => setIsRoadMapModalOpen(false)} />
      <ManualModal open={isManualModalOpen} onCancel={() => setIsManualModalOpen(false)} />
      <ContactModal open={isContactModalOpen} onCancel={() => setIsContactModalOpen(false)} />
    </Layout.Header>
  );
};

export default Header;
