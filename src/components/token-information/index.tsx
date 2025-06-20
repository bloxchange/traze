import React from 'react';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

interface TokenInformationProps {
  name: string;
}

const TokenInformation: React.FC<TokenInformationProps> = ({ name }) => {
  const { t } = useTranslation();

  return (
    <div>
      <Title level={4}>{name}</Title>
      <Typography.Text>{t('tokenInformation.description')}</Typography.Text>
    </div>
  );
};

export default TokenInformation;