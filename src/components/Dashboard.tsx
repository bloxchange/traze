import React from 'react';
import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { Layout, Model, TabNode } from 'flexlayout-react';
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
            name: t('dashboardTitle'),
            component: 'main',
            config: {
              content: (
                <Card>
                  <Title level={2}>{t('dashboardTitle')}</Title>
                  <Typography.Text>{t('welcomeMessage')}</Typography.Text>
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
            name: 'Swarm',
            component: 'swarm',
            config: {
              content: <Swarm name="Default Swarm" wallets={[]} />
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

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    if (component === 'swarm') {
      return <Swarm name={node.getName()} wallets={[]} />;
    }
    return node.getConfig().content;
  };

  const onAddDragMouseDown = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    const componentTitle = e.dataTransfer.getData('componentTitle');

    if (componentType === 'swarm' && layoutRef.current) {
      layoutRef.current.addTabWithDragAndDrop(
        e as unknown as DragEvent,
        {
          type: 'tab',
          name: `${componentTitle} - New`,
          component: 'swarm',
        });
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
