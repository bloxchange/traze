import { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { ROADMAP_VERSION } from '../consts';

interface RoadMapModalProps {
  open: boolean;
  onClose: () => void;
}

export function RoadMapModal({ open, onClose }: RoadMapModalProps) {
  const { i18n } = useTranslation();

  const [content, setContent] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetch(
          `/roadmap/${i18n.language}-${ROADMAP_VERSION}.md`
        );

        const text = await response.text();

        setContent(text);
      } catch (error) {
        console.error('Error loading roadmap content:', error);
      }
    };

    if (open) {
      loadContent();
    }
  }, [open, i18n.language]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={800}
      title="Roadmap"
      footer={null}
    >
      <div
        className="markdown-content"
        style={{ maxHeight: '70vh', overflow: 'auto', padding: '16px 0' }}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Modal>
  );
}
