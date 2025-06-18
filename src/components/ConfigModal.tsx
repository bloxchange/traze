import { Modal, Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { type Configuration } from '../models';

interface ConfigModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (config: Configuration) => void;
  initialValues: Configuration;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ open, onCancel, onSubmit, initialValues }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal title={t('settings.configuration')} open={open} onOk={handleOk} onCancel={onCancel}>
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="rpcUrl"
          label={t('settings.rpcUrl')}
          rules={[{ required: true, message: t('settings.rpcUrlRequired') }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigModal;
