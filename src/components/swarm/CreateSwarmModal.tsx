import React from 'react';
import { Modal, Form, Input, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CreateSwarmModalProps } from '@/models';

const { TextArea } = Input;

const CreateSwarmModal: React.FC<CreateSwarmModalProps> = ({
  open,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const privateKeys = values.privateKeys
        ? values.privateKeys
          .split('\n')
          .map((key: string) => key.trim())
          .filter((key: string) => key.length > 0)
        : [];

      const generateCount = values.generateCount || 0;

      if (privateKeys.length === 0 && generateCount === 0) {
        form.setFields([
          {
            name: 'generateCount',
            errors: [t('swarm.createModal.atLeastOneRequired')],
          },
        ]);
        return;
      }

      await onSubmit(privateKeys, generateCount);

      form.resetFields();
    } catch (error) {
      // Form validation error is handled by antd Form
      console.error('Form submission error:', error);
    }
  };

  return (
    <Modal
      title={t('swarm.createModal.title')}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ generateCount: 0 }}>
        <Form.Item
          name="privateKeys"
          label={t('swarm.createModal.privateKeys')}
        >
          <TextArea
            rows={4}
            placeholder={t('swarm.createModal.privateKeysPlaceholder')}
          />
        </Form.Item>

        <Form.Item
          name="generateCount"
          label={t('swarm.createModal.generateCount')}
          rules={[{ type: 'number', min: 0 }]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder={t('swarm.createModal.generateCountPlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateSwarmModal;
