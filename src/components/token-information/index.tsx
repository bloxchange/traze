import React from 'react';
import { Typography, Spin, Alert, Descriptions, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import { useToken } from '../../hooks';

const { Title } = Typography;

const TokenInformation: React.FC = () => {
  const { t } = useTranslation();
  const { tokenState } = useToken();
  const { currentToken, loading, error } = tokenState;

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!currentToken) {
    return (
      <Alert
        type="info"
        message={t('tokenInformation.noToken')}
        description={t('tokenInformation.searchPrompt')}
      />
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        {currentToken.icon && (
          <img
            src={currentToken.icon}
            alt={currentToken.name}
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
        )}
        <Title level={4} style={{ margin: 0 }}>
          {currentToken.symbol} / {currentToken.name}
        </Title>
      </div>

      <Descriptions bordered column={1}>
        <Descriptions.Item label={t('tokenInformation.mint')}>
          {currentToken.mint}
        </Descriptions.Item>
        <Descriptions.Item label={t('tokenInformation.decimals')}>
          {currentToken.decimals}
        </Descriptions.Item>
        <Descriptions.Item label={t('tokenInformation.totalSupply')}>
          {currentToken.totalSupply.toLocaleString()}
        </Descriptions.Item>
        {currentToken.externalUrl && (
          <Descriptions.Item label={t('tokenInformation.externalUrl')}>
            <a href={currentToken.externalUrl} target="_blank" rel="noopener noreferrer">
              {currentToken.externalUrl}
            </a>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
};

export default TokenInformation;