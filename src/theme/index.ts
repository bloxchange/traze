import { type ThemeConfig, theme } from 'antd';

const { darkAlgorithm, compactAlgorithm } = theme;

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#ffffff',
    colorText: '#000000',
    colorBgLayout: '#f0f2f5',
  },
  algorithm: compactAlgorithm,
  cssVar: true,
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#ffae0d',
    colorTextHeading: '#ffae0d',
    colorText: '#e9edf6',
    colorBgBase: '#0a0f1b',
    colorBgLayout: '#0a0f1b',
    colorBgContainer: '#0f141e',
    colorBorder: '#262a37',
    colorBorderBg: '#262a37',
    colorBorderSecondary: '#262a37',
  },
  algorithm: darkAlgorithm,
  cssVar: true,
  components: {
    Layout: {
      headerBg: '#0f141e',
    },
    Modal: {
      footerBg: '#0a0f1b',
      contentBg: '#0a0f1b',
      headerBg: '#0a0f1b',
    }
  },
};

export type ThemeMode = 'light' | 'dark';
