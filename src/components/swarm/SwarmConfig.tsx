import React from 'react';
import { Card, Form, Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface SwarmConfigProps {
  onBack: () => void;
}

const SwarmConfig: React.FC<SwarmConfigProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

interface SwarmConfigFormValues {
  name: string;
  description?: string;
}

  const handleSubmit = (values: SwarmConfigFormValues) => {
    console.log('Form values:', values);
    // Implement config save logic
    onBack();
  };

  return (
    <Card className="swarm-config" style={{ height: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('swarm.name')}
          name="name"
          rules={[{ required: true, message: t('swarm.nameRequired') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('swarm.description')}
          name="description"
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t('swarm.save')}
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={onBack}>
            {t('Back')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SwarmConfig;