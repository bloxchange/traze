import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';

interface ContactModalProps {
  open: boolean;
  onCancel: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ open, onCancel }) => {
  const { t } = useTranslation();

  return (
    <Modal title={t('common.tooltips.contact')} open={open} onCancel={onCancel} footer={null}>
      <div className="contact-content">
        <p>{t('contact.description')}</p>
        <ul>
          <li>
            <strong>Email:</strong> ducnn@bloxchange.dev
          </li>
          <li>
            <strong>X:</strong>{' '}
            <a href="https://x.com/bloxchangedev" target="_blank" rel="noopener noreferrer">
              @bloxchangedev
            </a>
          </li>
          <li>
            <strong>Discord:</strong>{' '}
            <a href="https://discord.gg/fVM6pd3Z" target="_blank" rel="noopener noreferrer">
              https://discord.gg/fVM6pd3Z
            </a>
          </li>
          <li>
            <strong>GitHub:</strong>{' '}
            <a href="https://github.com/bloxchange/traze" target="_blank" rel="noopener noreferrer">
              github.com/bloxchange/traze
            </a>
          </li>
        </ul>
      </div>
    </Modal>
  );
};

export default ContactModal;
