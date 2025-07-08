import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';

interface FaqModalProps {
  open: boolean;
  onCancel: () => void;
}

const FaqModal: React.FC<FaqModalProps> = ({ open, onCancel }) => {
  const { i18n } = useTranslation();
  const [content, setContent] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(`/faq/${i18n.language}.md`);

        const text = await response.text();

        setContent(text);
      } catch (error) {
        console.error('Error loading FAQ content:', error);
      }
    };

    loadContent();
  }, [i18n.language]);

  return (
    <Modal title="FAQs" open={open} onCancel={onCancel} footer={null} width={800}>
      <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Modal>
  );
};

export default FaqModal;
