import React from 'react';
import { Modal, Form, Input, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';

interface CreateSwarmModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (publicKeys: string[], generateCount: number) => void;
}

const CreateSwarmModal: React.FC<CreateSwarmModalProps> = ({
  open,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const publicKeys = values.publicKeys
        ? values.publicKeys.split('\n').filter((key: string) => key.trim())
        : [];
      onSubmit(publicKeys, values.generateCount || 0);
      form.resetFields();
    });
  };

  return (
    <Modal
      title={t('swarm.createSwarm')}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ generateCount: 0 }}
      >
        <Form.Item
          name="publicKeys"
          label={t('swarm.publicKeys')}
        >
          <Input.TextArea
            rows={4}
            placeholder={t('swarm.enterPublicKeys')}
          />
        </Form.Item>
        <Form.Item
          name="generateCount"
          label={t('swarm.generateNewKeys')}
        >
          <InputNumber
            min={0}
            max={100}
            style={{ width: '100%' }}
            placeholder={t('swarm.generateKeysPlaceholder')}
          />
        </Form.Item>
        </Form>
    </Modal>
  );
};

export default CreateSwarmModal;