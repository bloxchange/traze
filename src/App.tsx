import React, { useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import { lightTheme, darkTheme, type ThemeMode } from './theme';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { ConfigurationProvider } from './contexts/ConfigurationContext';
import { Layout as FlexLayout } from 'flexlayout-react';

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
      <ConfigProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        <Layout style={{ minHeight: '100vh', width: '100%' }}>
          <Header
            flexLayoutRef={flexLayoutRef}
            theme={theme}
            onThemeChange={toggleTheme}
          />
          <Content style={{ padding: '24px', maxWidth: '100%', position: 'relative' }}>
            <Dashboard flexLayoutRef={flexLayoutRef} />
          </Content>
        </Layout>
      </ConfigProvider>
    </ConfigurationProvider>
  );
}

export default App;
