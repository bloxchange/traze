import React from 'react';
import { useTranslation } from 'react-i18next';
import { Actions, Layout, Model, TabNode } from 'flexlayout-react';
import Swarm from './swarm';
import TokenInformation from './token-information';
import LiquidityPools from './liquidity-pools';
import Transactions from './transactions';
import 'flexlayout-react/style/dark.css';
import './Dashboard.css';

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
            name: t('tokenInformation.title'),
            component: 'tokenInformation',
            config: {
              name: t('tokenInformation.title'),
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
              wallets: []
            },
          },
        ],
      },
    ],
  },
});

const Dashboard: React.FC<{ flexLayoutRef: React.RefObject<Layout> }> = ({ flexLayoutRef }) => {
  const { t } = useTranslation();

  const layoutModel = React.useRef(Model.fromJson(createDefaultLayout(t)));
  const model = layoutModel.current;

  const handleNameChange = (node: TabNode, newName: string) => {
    const component = node.getComponent();

    if (component !== 'swarm') {
      return;
    }

    const componentTitle = t('swarm.title');

    node.getModel().doAction(Actions.renameTab(node.getId(), `${componentTitle} - ${newName}`));
  };

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const config = node.getConfig();

    switch (component) {
      case 'swarm':
        return (
          <Swarm
            name={config.name}
            wallets={config.wallets}
            onNameChange={(newName) => handleNameChange(node, newName)}
          />
        );
      case 'tokenInformation':
        return <TokenInformation />;
      case 'liquidityPools':
        return <LiquidityPools name={config.name} />;
      case 'transactions':
        return <Transactions name={config.name} />;
      default:
        return config.content;
    }
  };

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      onDragOver={(e) => e.preventDefault()}
    >
      <Layout ref={flexLayoutRef} model={model} factory={factory} />
    </div>
  );
};

export default Dashboard;
