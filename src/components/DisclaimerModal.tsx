import React, { useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';

const DisclaimerModal: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  return (
    <Modal
      title={t('disclaimer.title', 'Disclaimer')}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleOk}
      closable={false}
      maskClosable={false}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <div dangerouslySetInnerHTML={{
        __html: t('disclaimer.content', `
        <p>This software is completely free and for community. By using this software, you acknowledge and agree that:</p>
        <ul>
          <li>Trading cryptocurrencies involves substantial risk and may result in the loss of your invested capital.</li>
          <li>You are solely responsible for your trading decisions and any resulting gains or losses.</li>
          <li>The software developers and contributors are not liable for any damages or losses incurred through the use of this software.</li>
          <li>You will comply with all applicable laws and regulations in your jurisdiction regarding cryptocurrency trading.</li>
        </ul>
      `)
      }} />
    </Modal>
  );
};

export default DisclaimerModal;