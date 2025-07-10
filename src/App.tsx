import React, { useState, useEffect } from 'react';
import { ConfigProvider, Layout } from 'antd';
import { lightTheme, darkTheme, type ThemeMode } from './theme';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import DisclaimerModal from './components/DisclaimerModal';
import TutorialOverlay from './components/TutorialOverlay';
import { ConfigurationProvider } from './contexts/ConfigurationContext';
import { Layout as FlexLayout } from 'flexlayout-react';
import { TokenProvider } from './contexts/TokenContext';

import './i18n';
import { RpcConnectionProvider } from './contexts/RpcConnectionContext';

const { Content } = Layout;

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('theme_preference');

    return savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : 'dark';
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const flexLayoutRef = React.useRef<FlexLayout>(null);

  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed');

    if (!tutorialCompleted) {
      setShowTutorial(true);
    } else {
      setShowDisclaimer(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);

    localStorage.setItem('theme_preference', newTheme);
  };

  const handleTutorialFinish = () => {
    setShowTutorial(false);

    setShowDisclaimer(true);
  };

  return (
    <ConfigurationProvider>
      <RpcConnectionProvider>
        <TokenProvider>
          <ConfigProvider theme={theme === 'light' ? lightTheme : darkTheme}>
            <Layout style={{ minHeight: '100vh', width: '100%' }}>
              <Header
                flexLayoutRef={flexLayoutRef}
                theme={theme}
                onThemeChange={toggleTheme}
              />
              <div
                style={{
                  height: 'calc(100vh - var(--ant-layout-header-height))',
                  padding: 6,
                }}
              >
                <Content
                  style={{
                    padding: '24px',
                    maxWidth: '100%',
                    position: 'relative',
                    height: '100%',
                  }}
                >
                  <Dashboard flexLayoutRef={flexLayoutRef} />
                </Content>
              </div>
              {showDisclaimer && <DisclaimerModal />}
              {showTutorial && (
                <TutorialOverlay onFinish={handleTutorialFinish} />
              )}
            </Layout>
          </ConfigProvider>
        </TokenProvider>
      </RpcConnectionProvider>
    </ConfigurationProvider>
  );
}

export default App;
