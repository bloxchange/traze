import React, { useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import { lightTheme, darkTheme, type ThemeMode } from './theme';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { ConfigurationProvider } from './contexts/ConfigurationContext';
import { Layout as FlexLayout } from 'flexlayout-react';
import { TokenProvider } from './contexts/TokenContext';

import './i18n';

const { Content } = Layout;

function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const flexLayoutRef = React.useRef<FlexLayout>(null);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ConfigurationProvider>
      <TokenProvider>
        <ConfigProvider theme={theme === 'light' ? lightTheme : darkTheme}>
          <Layout style={{ minHeight: '100vh', width: '100%' }}>
            <Header
              flexLayoutRef={flexLayoutRef}
              theme={theme}
              onThemeChange={toggleTheme}
            />
            <div
              style={{ height: 'calc(100vh - var(--ant-layout-header-height))', padding: 6 }}
            >
              <Content style={{ padding: '24px', maxWidth: '100%', position: 'relative', height: '100%' }}>
                <Dashboard flexLayoutRef={flexLayoutRef} />
              </Content>
            </div>
          </Layout>
        </ConfigProvider>
      </TokenProvider>
    </ConfigurationProvider>
  );
}

export default App;
