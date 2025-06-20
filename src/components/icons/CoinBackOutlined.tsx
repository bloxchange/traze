import React from 'react';
import Icon from '@ant-design/icons';

interface CoinBackOutlinedProps {
  className?: string;
  style?: React.CSSProperties;
}

const CoinBackSvg: React.FC = () => (
  <span style={{ width: '24px', height: '24px' }}>
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
    </svg>
  </span>
);

const CoinBackOutlined: React.FC<CoinBackOutlinedProps> = ({ className, style }) => (
  <Icon component={CoinBackSvg} className={className} style={style} />
);

export default CoinBackOutlined;