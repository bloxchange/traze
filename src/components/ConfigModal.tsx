import { Modal, Form, Input, Radio, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { type Configuration } from '../models';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

interface ConfigModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (config: Configuration) => void;
  initialValues: Configuration;
}

const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
}) => {
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
    <Modal
      title={t('settings.configuration')}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <p style={{ marginBottom: 16 }}>{t('settings.description')}</p>
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.List name="rpcUrls" initialValue={['']}>
          {(fields, { add, remove }) => (
            <>
              <Form.Item label={t('settings.rpcUrl')} required>
                {fields.map((field, index) => (
                  <div key={field.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <Form.Item
                      name={field.name}
                      fieldKey={field.fieldKey}
                      rules={[{ required: true, message: t('settings.rpcUrlRequired') }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder={`RPC URL ${index + 1}`} />
                    </Form.Item>
                    {fields.length > 1 ? (
                      <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                    ) : null}
                  </div>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    {t('settings.addRpcUrl')}
                  </Button>
                </Form.Item>
              </Form.Item>
            </>
          )}
        </Form.List>
        <Form.Item
          name="rpcWebsocketUrl"
          label={t('settings.rpcWebsocketUrl')}
          rules={[
            { required: true, message: t('settings.rpcWebsocketUrlRequired') },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t('settings.jitoEndpoint')}
          name="jitoEndpoint"
          rules={[
            { required: true, message: t('settings.jitoEndpointRequired') },
          ]}
          extra={t('settings.jitoEndpointDescription')}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="balanceUpdateMode"
          label={t('settings.balanceUpdateMode')}
          extra={t('settings.balanceUpdateModeDescription')}
        >
          <Radio.Group>
            <Radio value="rpc">{t('settings.balanceUpdateModeRpc')}</Radio>
            <Radio value="calculate">
              {t('settings.balanceUpdateModeCalculate')}
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConfigModal;
