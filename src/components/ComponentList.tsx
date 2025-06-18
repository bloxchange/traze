import React from 'react';
import { Space } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import './ComponentList.css';

interface DraggableIconProps {
  type: string;
  title: string;
  icon: React.ReactNode;
}

const DraggableIcon: React.FC<DraggableIconProps> = ({ type, title, icon }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.setData('componentTitle', title);
  };

  return (
    <div
      className="draggable-icon"
      draggable
      onDragStart={handleDragStart}
      title={title}
    >
      {icon}
    </div>
  );
};

const ComponentList: React.FC = () => {
  return (
    <Space className="component-list">
      <DraggableIcon
        type="swarm"
        title="Swarm"
        icon={<TeamOutlined style={{ fontSize: '24px' }} />}
      />
    </Space>
  );
};

export default ComponentList;