import React from 'react';
import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Actions, Layout, Model, TabNode } from 'flexlayout-react';
import Swarm from './swarm';
import 'flexlayout-react/style/dark.css';
import './Dashboard.css';

const { Title } = Typography;

const createDefaultLayout = (t: (key: string) => string) => ({
  global: {
    tabEnableFloat: true,
    tabSetEnableMaximize: true,
  },
  borders: [],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        weight: 50,
        children: [
          {
            type: 'tab',
            name: t('dashboard.title'),
            component: 'main',
            config: {
              content: (
                <Card>
                  <Title level={2}>{t('dashboard.title')}</Title>
                  <Typography.Text>{t('dashboard.welcomeMessage')}</Typography.Text>
                </Card>
              ),
            },
          },
        ],
      },
      {
        type: 'tabset',
        weight: 50,
        children: [
          {
            type: 'tab',
            name: `${t('swarm.title')} - ${t('common.untitled')}`,
            component: 'swarm',
            config: {
              name: t('common.untitled'),
              wallets: ['2FBQESMTM4CtuEvUMqF5cQevoEBWETYRVNxG8pC8FmWbfp9FV26SvNtTneGhVxbCETZGKaeTHQrpLj4CSe449Huf']
            },
          },
        ],
      },
    ],
  },
});

const Dashboard = () => {
  const { t } = useTranslation();
  const layoutModel = React.useRef(Model.fromJson(createDefaultLayout(t)));
  const model = layoutModel.current;
  const layoutRef = React.useRef<Layout>(null);

  const handleNameChange = (node: TabNode, newName: string) => {
    node.getModel().doAction(Actions.renameTab(node.getId(), `${t('swarm.title')} - ${newName}`));
  };

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    if (component === 'swarm') {
      const config = node.getConfig();
      return (
        <Swarm
          name={config.name}
          wallets={config.wallets}
          onNameChange={(newName) => handleNameChange(node, newName)}
        />
      );
    }
    return node.getConfig().content;
  };

  const onAddDragMouseDown = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');

    if (componentType === 'swarm' && layoutRef.current) {
      layoutRef.current.addTabWithDragAndDrop(
        e as unknown as DragEvent,
        {
          type: 'tab',
          name: `${t('swarm.title')} - ${t('common.untitled')}`,
          component: 'swarm',
          config: {
            name: t('common.untitled'),
            wallets: []
          }
        }
      );
    }
  };

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onAddDragMouseDown}
    >
      <Layout ref={layoutRef} model={model} factory={factory} />
    </div>
  );
};

export default Dashboard;
