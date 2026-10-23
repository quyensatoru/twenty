import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlug } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import {
  DISCOUNT_CONNECTION_SAVE_ROUTE_PATH,
  DISCOUNT_CONNECTIONS_ROUTE_PATH,
} from '../../constants/discount';
import {
  type DiscountConnectionItem,
  type DiscountConnectionsResult,
} from '../../types/discount';
import { formatDateTime } from '../utils/format-inbox-time.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { Field, TextInput } from './discount-fields';
import { AppBadge } from './discount-parts';
import { DiscountSidePanel } from './discount-side-panel';
import { ConnectionsSkeleton } from './discount-skeleton';
import { DISCOUNT_TOKENS, spacing } from './discount-theme';

const ConnectionRow = ({
  connection,
  onSaved,
}: {
  connection: DiscountConnectionItem;
  onSaved: (connection: DiscountConnectionItem) => void;
}) => {
  const [endpoint, setEndpoint] = useState(connection.endpoint);
  const [secret, setSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isConnected = connection.endpoint.length > 0 && connection.hasSecret;
  const isDirty = endpoint.trim() !== connection.endpoint || secret.length > 0;

  const save = async (secretToSave: string | null) => {
    setIsSaving(true);

    try {
      const result = await postAppRoute<{
        success: true;
        endpoint: string;
        hasSecret: boolean;
      }>(DISCOUNT_CONNECTION_SAVE_ROUTE_PATH, {
        appId: connection.appId,
        endpoint,
        ...(secretToSave === null ? {} : { secret: secretToSave }),
      });

      setSecret('');
      onSaved({
        ...connection,
        endpoint: result.endpoint,
        hasSecret: result.hasSecret,
        updatedAt: new Date().toISOString(),
      });
      void enqueueSnackbar({
        message: t('{app} connection saved', { app: connection.appName }),
        variant: 'success',
      });
    } catch (caught) {
      void enqueueSnackbar({ message: readErrorText(caught), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      style={{
        borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing(3),
        padding: spacing(4),
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: spacing(2) }}>
        <AppBadge appName={connection.appName} />
        <span style={{ color: DISCOUNT_TOKENS.textTertiary, flex: 1, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>
          {t('{count} discounts', { count: connection.discountCount })}
        </span>
        <Tag color={isConnected ? 'green' : 'gray'} variant="soft" weight="medium" preventShrink>
          {isConnected ? t('Connected') : t('Not connected')}
        </Tag>
      </div>
      <Field label={t('Endpoint')}>
        <TextInput
          ariaLabel={t('Endpoint of {app}', { app: connection.appName })}
          type="url"
          value={endpoint}
          placeholder="https://api.example.com/crm/discount"
          onChange={setEndpoint}
        />
      </Field>
      <Field
        label={t('Signing secret')}
        hint={connection.hasSecret ? t('A secret is saved. Type a new one to replace it.') : undefined}
      >
        <TextInput
          ariaLabel={t('Signing secret of {app}', { app: connection.appName })}
          type="password"
          value={secret}
          placeholder={connection.hasSecret ? '••••••••••••' : t('Signing secret')}
          onChange={setSecret}
        />
      </Field>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
        <span style={{ color: DISCOUNT_TOKENS.textTertiary, flex: 1, fontSize: DISCOUNT_TOKENS.fontSizeSm }}>
          {connection.updatedAt === null
            ? t('Never set')
            : t('Changed {time} by {name}', {
                time: formatDateTime(connection.updatedAt),
                name: connection.updatedBy ?? '—',
              })}
        </span>
        {connection.hasSecret && (
          <Button variant="ghost" color="danger" size="sm" disabled={isSaving} onClick={() => void save('')}>
            {t('Remove secret')}
          </Button>
        )}
        <Button
          variant="solid"
          color="accent"
          size="sm"
          loading={isSaving}
          disabled={isSaving || !isDirty}
          onClick={() => void save(secret.length > 0 ? secret : null)}
        >
          {t('Save')}
        </Button>
      </div>
    </section>
  );
};

type DiscountConnectionsPanelProps = {
  width: number | string;
  onClose: () => void;
  onChanged: () => void;
};

// One connection per Task Manager app: an app added there appears here
// without a deploy, and its discounts are sent once it has both values.
export const DiscountConnectionsPanel = ({
  width,
  onClose,
  onChanged,
}: DiscountConnectionsPanelProps) => {
  const [connections, setConnections] = useState<DiscountConnectionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    postAppRoute<DiscountConnectionsResult & { success: true }>(
      DISCOUNT_CONNECTIONS_ROUTE_PATH,
      {},
    )
      .then((result) => setConnections(result.connections))
      .catch((caught) => setError(readErrorText(caught)));
  }, []);

  return (
    <DiscountSidePanel
      ariaLabel={t('App connections')}
      title={t('App connections')}
      icon={<IconPlug size={16} />}
      width={width}
      onClose={onClose}
    >
      <div
        style={{
          borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
          color: DISCOUNT_TOKENS.textSecondary,
          lineHeight: 1.5,
          padding: spacing(4),
        }}
      >
        {t('Where each app receives its discounts. The CRM signs every delivery with the secret (x-twenty-webhook-signature), so reuse the secret the app already checks. Apps added in Task Manager appear here on their own.')}
      </div>
      {error !== null ? (
        <div style={{ padding: spacing(4) }}>
          <Banner color="danger" variant="secondary">{error}</Banner>
        </div>
      ) : connections === null ? (
        <ConnectionsSkeleton />
      ) : (
        connections.map((connection) => (
          <ConnectionRow
            key={connection.appId}
            connection={connection}
            onSaved={(saved) => {
              setConnections((previous) =>
                (previous ?? []).map((item) =>
                  item.appId === saved.appId ? saved : item,
                ),
              );
              onChanged();
            }}
          />
        ))
      )}
    </DiscountSidePanel>
  );
};
