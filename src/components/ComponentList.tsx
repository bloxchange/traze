import React from 'react';
import { Space, Tooltip } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  BankOutlined,
  SwapOutlined,
  RocketOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Layout as FlexLayout } from 'flexlayout-react';
import './ComponentList.css';

interface DraggableIconProps {
  type: string;
  icon: React.ReactNode;
  flexLayoutRef: React.RefObject<FlexLayout>;
}

const DraggableIcon: React.FC<DraggableIconProps> = ({
  type,
  icon,
  flexLayoutRef,
}) => {
  const { t } = useTranslation();

  const title = t(`${type}.title`);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();

    e.dataTransfer.setData('componentType', type);

    e.dataTransfer.setData('componentTitle', title);

    if (flexLayoutRef.current) {
      flexLayoutRef.current!.setDragComponent(e.nativeEvent, title, 10, 10);

      flexLayoutRef.current.addTabWithDragAndDrop(e.nativeEvent, {
        type: 'tab',
        name: type == 'swarm' ? `${title} - ${t('common.untitled')}` : title,
        component: type,
        config: {
          name: t('common.untitled'),
        },
      });
    }
  };

  return (
    <Tooltip title={title}>
      <div className="draggable-icon" draggable onDragStart={handleDragStart}>
        {icon}
      </div>
    </Tooltip>
  );
};

const ComponentList: React.FC<{
  flexLayoutRef: React.RefObject<FlexLayout>;
}> = ({ flexLayoutRef }) => {
  return (
    <Space className="component-list">
      <DraggableIcon
        type="swarm"
        icon={<TeamOutlined style={{ fontSize: '24px' }} />}
        flexLayoutRef={flexLayoutRef}
      />
      <DraggableIcon
        type="tokenInformation"
        icon={<DollarOutlined style={{ fontSize: '24px' }} />}
        flexLayoutRef={flexLayoutRef}
      />
      <DraggableIcon
        type="liquidityPools"
        icon={<BankOutlined style={{ fontSize: '24px' }} />}
        flexLayoutRef={flexLayoutRef}
      />
      <DraggableIcon
        type="transactions"
        icon={<SwapOutlined style={{ fontSize: '24px' }} />}
        flexLayoutRef={flexLayoutRef}
      />
      <DraggableIcon
        type="pumpState"
        icon={<RocketOutlined style={{ fontSize: '24px' }} />}
        flexLayoutRef={flexLayoutRef}
      />
      <DraggableIcon
        type="outsideTransactions"
        icon={<ExportOutlined style={{ fontSize: '24px' }} />}
        flexLayoutRef={flexLayoutRef}
      />
    </Space>
  );
};

export default ComponentList;
