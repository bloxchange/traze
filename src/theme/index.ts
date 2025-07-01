import { type ThemeConfig, theme } from 'antd';

const { darkAlgorithm, compactAlgorithm } = theme;

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#fafaf9',
    colorText: '#000000',
    colorBgLayout: '#fafaf9',
    colorBorder: '#fcd34d',
  },
  algorithm: compactAlgorithm,
  cssVar: true,
  components: {
    Layout: {
      headerBg: '#fafaf9',
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#ffae0d',
    colorTextHeading: '#ffae0d',
    colorText: '#e9edf6',
    colorBgBase: '#0a0f1b',
    colorBgLayout: '#0a0f1b',
    colorBgContainer: '#0f141e',
    colorBorder: '#333',
    colorBorderBg: '#333',
    colorBorderSecondary: '#333',
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
    },
    Card: {
      bodyPadding: 12,
    },
  },
};

export type ThemeMode = 'light' | 'dark';
