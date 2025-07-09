import { Modal, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './ManualModal.css';

interface ManualModalProps {
  open: boolean;
  onCancel: () => void;
}

const ManualModal: React.FC<ManualModalProps> = ({ open, onCancel }) => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchManual = async () => {
      if (open) {
        setLoading(true);
        try {
          const response = await fetch(`/manual/${i18n.language}.md`);

          const text = await response.text();

          setContent(text);
        } catch (error) {
          console.error('Error loading manual:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchManual();
  }, [open, i18n.language]);

  return (
    <Modal title={t('manual.title')} open={open} onCancel={onCancel} footer={null} width={800}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      ) : (
        <div className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </Modal>
  );
};

export default ManualModal;
