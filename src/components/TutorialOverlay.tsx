import { Tour } from 'antd';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { TourProps } from 'antd';
import { theme } from 'antd';

interface TutorialOverlayProps {
  onFinish: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onFinish }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState(0);
  const { token } = theme.useToken();

  const steps: TourProps['steps'] = [
    {
      title: t('tutorial.welcome.title'),
      description: t('tutorial.welcome.description'),
      target: () => document.querySelector('.ant-layout-header') as HTMLElement,
    },
    {
      title: t('tutorial.componentList.title'),
      description: t('tutorial.componentList.description'),
      target: () => document.querySelector('.component-list') as HTMLElement,
    },
    {
      title: t('tutorial.navigationButtons.title'),
      description: t('tutorial.navigationButtons.description'),
      target: () => document.querySelector('.header-buttons') as HTMLElement,
      placement: 'bottomRight',
    },
    {
      title: t('tutorial.workspace.title'),
      description: t('tutorial.workspace.description'),
      target: () =>
        document.querySelector('.flexlayout__layout') as HTMLElement,
    },
  ];

  const handleFinish = () => {
    setOpen(false);

    localStorage.setItem('tutorial_completed', 'true');

    onFinish();
  };

  return (
    <Tour
      open={open}
      onClose={handleFinish}
      onFinish={handleFinish}
      steps={steps}
      mask
      current={current}
      onChange={setCurrent}
      actionsRender={() => {
        const total = steps.length;
        return [
          <button
            key="quit"
            onClick={handleFinish}
            style={{
              border: 'none',
              padding: '4px 8px',
              background: token.colorPrimary,
              color: token.colorWhite,
              borderRadius: token.borderRadiusSM,
              cursor: 'pointer',
              marginRight: 8,
            }}
          >
            {t('tutorial.quit')}
          </button>,
          <span key="indicator" style={{ marginRight: 8 }}>
            {(current + 1).toString()}/{total.toString()}
          </span>,
          <button
            key="prev"
            style={{
              border: '1px solid',
              borderColor: token.colorPrimary,
              padding: '4px 8px',
              background: 'transparent',
              color: token.colorPrimary,
              borderRadius: token.borderRadiusSM,
              cursor: 'pointer',
              marginRight: 8,
            }}
            onClick={() => setCurrent((curr) => Math.max(curr - 1, 0))}
            disabled={current <= 0}
          >
            {t('common.previous')}
          </button>,
          <button
            key="next"
            style={{
              border: 'none',
              padding: '4px 8px',
              background: token.colorPrimary,
              color: token.colorWhite,
              borderRadius: token.borderRadiusSM,
              cursor: 'pointer',
            }}
            onClick={() => {
              if (current === total - 1) {
                handleFinish();
              } else {
                setCurrent((curr) => Math.min(curr + 1, total - 1));
              }
            }}
          >
            {current === total - 1 ? t('common.finish') : t('common.next')}
          </button>,
        ];
      }}
    />
  );
};

export default TutorialOverlay;
