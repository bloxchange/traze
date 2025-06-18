import { useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
//import { useTranslation } from 'react-i18next';
import { lightTheme, darkTheme, type ThemeMode } from './theme';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { ConfigurationProvider } from './contexts/ConfigurationContext';
import './i18n';

const { Content } = Layout;

function App() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  //const { i18n } = useTranslation();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ConfigurationProvider>
      <ConfigProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        <Layout style={{ minHeight: '100vh', width: '100%' }}>
          <Header theme={theme} onThemeChange={toggleTheme} />
          <Content style={{ padding: '24px', maxWidth: '100%', position: 'relative' }}>
            <Dashboard />
          </Content>
        </Layout>
      </ConfigProvider>
    </ConfigurationProvider>
  );
}

export default App;
