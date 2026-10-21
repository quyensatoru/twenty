import { type ReactNode, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { Button, SegmentedControl, Switch } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';

import {
  INTERVAL_MINUTE_OPTIONS,
  RETENTION_HOUR_OPTIONS,
  TIMEOUT_SECOND_OPTIONS,
} from '../../constants/health-options';
import { TEST_HEALTH_CONNECTION_ROUTE_PATH } from '../../constants/route-paths';
import { type HealthRuleMetric } from '../../types/health-metric';
import { type HealthMonitorConfig } from '../../types/health-monitor-config';
import { type HealthRule } from '../../types/health-rule';
import {
  type HealthConfigResult,
  type HealthConnectionTestResult,
} from '../../types/health-route-results';
import {
  formatCount,
  formatMilliseconds,
  formatRangeLabel,
} from '../utils/format-health.util';
import { formatNodeLabel } from '../../utils/format-node-label.util';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { CheckboxField } from './checkbox-field';
import { DrawerShell } from './drawer-shell';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';
import { LabeledField } from './labeled-field';
import { RecipientsEditor } from './recipients-editor';
import { RulesEditor } from './rules-editor';
import { TextInput } from './text-input';

type ConfigDrawerProps = {
  source: HealthConfigResult;
  onClose: () => void;
  onSave: (config: HealthMonitorConfig) => Promise<void>;
};

const SNAPSHOT_KILOBYTES = 3.5;

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <Card.Root rounded fullWidth style={{ flexShrink: 0 }}>
    <Card.Header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span>{title}</span>
        {subtitle !== undefined && (
          <span
            style={{
              fontWeight: 'normal',
              color: HEALTH_TOKENS.textTertiary,
              fontSize: HEALTH_TOKENS.fontSizeSm,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </Card.Header>
    <Card.Content>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(3),
          width: '100%',
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </Card.Content>
  </Card.Root>
);

const readInteger = (text: string): number | null => {
  const value = Number.parseInt(text, 10);

  return Number.isFinite(value) ? value : null;
};

export const ConfigDrawer = ({
  source,
  onClose,
  onSave,
}: ConfigDrawerProps) => {
  const [draft, setDraft] = useState<HealthMonitorConfig>(source.config);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] =
    useState<HealthConnectionTestResult | null>(null);

  const update = (
    patch:
      | Partial<HealthMonitorConfig>
      | ((current: HealthMonitorConfig) => Partial<HealthMonitorConfig>),
  ) =>
    setDraft((current) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }));

  const changeRule = (
    ruleId: string,
    patch: Partial<HealthRule> | ((rule: HealthRule) => Partial<HealthRule>),
  ) =>
    update((current) => ({
      rules: current.rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, ...(typeof patch === 'function' ? patch(rule) : patch) }
          : rule,
      ),
    }));

  const addRule = (metric: HealthRuleMetric) =>
    update((current) => ({
      rules: [
        ...current.rules,
        {
          id: `rule-${Date.now()}`,
          metric,
          scopeNodeKey: null,
          scopeServiceName: null,
          warningValue: null,
          criticalValue: null,
          isEnabled: true,
        },
      ],
    }));

  const testConnection = async () => {
    setIsTesting(true);

    try {
      setTestResult(
        await postAppRoute<
          HealthConnectionTestResult & Record<string, unknown>
        >(TEST_HEALTH_CONNECTION_ROUTE_PATH, {
          appId: source.appId,
          endpointUrl: draft.endpointUrl,
          headerName: draft.headerName,
          headerValue: draft.headerValue,
          timeoutSeconds: draft.timeoutSeconds,
        }),
      );
    } catch (error) {
      setTestResult({
        ok: false,
        httpStatus: null,
        latencyMs: null,
        nodeCount: 0,
        processCount: 0,
        nodeKeys: [],
        error: readErrorText(error),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const save = async () => {
    setIsSaving(true);

    try {
      await onSave(draft);
      void enqueueSnackbar({
        message: t('Health settings saved.'),
        variant: 'success',
      });
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const pollsPerHour = 60 / draft.intervalMinutes;
  const knownNodeKeys = [
    ...new Set([...source.knownNodeKeys, ...(testResult?.nodeKeys ?? [])]),
  ];

  return (
    <DrawerShell
      title={t('Monitor settings')}
      subtitle={t('App {app} · Task Manager', { app: source.appName })}
      onClose={onClose}
      headerAside={
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing(2),
            cursor: 'pointer',
          }}
        >
          <Switch
            aria-label={t('Monitoring enabled')}
            checked={draft.isEnabled}
            onCheckedChange={() =>
              update((current) => ({ isEnabled: !current.isEnabled }))
            }
          />
          {draft.isEnabled ? t('Enabled') : t('Disabled')}
        </label>
      }
      footer={
        <>
          <Button variant="outline" color="neutral" size="md" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            variant="solid"
            color="accent"
            size="md"
            loading={isSaving}
            disabled={isSaving}
            onClick={() => void save()}
          >
            {t('Save settings')}
          </Button>
        </>
      }
    >
      <Section title={t('Connection')}>
        <LabeledField label={t('Endpoint')}>
          <TextInput
            type="url"
            ariaLabel={t('Endpoint')}
            placeholder="https://api.example.com/health"
            value={draft.endpointUrl}
            onChange={(endpointUrl) => update({ endpointUrl })}
          />
        </LabeledField>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(3) }}>
          <LabeledField label={t('Header')} grow>
            <TextInput
              ariaLabel={t('Header name')}
              value={draft.headerName}
              onChange={(headerName) => update({ headerName })}
            />
          </LabeledField>
          <LabeledField
            label={t('Header value')}
            hint={
              draft.hasHeaderValue
                ? t('Saved. Leave empty to keep it.')
                : t('Write-only, never shown again.')
            }
            grow
          >
            <TextInput
              type="password"
              ariaLabel={t('Header value')}
              placeholder={draft.hasHeaderValue ? '••••••••' : t('secret')}
              value={draft.headerValue ?? ''}
              onChange={(value) =>
                update({ headerValue: value.length > 0 ? value : null })
              }
            />
          </LabeledField>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing(4),
            alignItems: 'flex-end',
          }}
        >
          <LabeledField label={t('Poll every')}>
            <SegmentedControl
              aria-label={t('Poll every')}
              value={String(draft.intervalMinutes)}
              onValueChange={(value) =>
                update({ intervalMinutes: Number(value) })
              }
              options={INTERVAL_MINUTE_OPTIONS.map((minutes) => ({
                value: String(minutes),
                label: t('{count} min', { count: minutes }),
              }))}
            />
          </LabeledField>
          <LabeledField label={t('Timeout')}>
            <SegmentedControl
              aria-label={t('Timeout')}
              value={String(draft.timeoutSeconds)}
              onValueChange={(value) =>
                update({ timeoutSeconds: Number(value) })
              }
              options={TIMEOUT_SECOND_OPTIONS.map((seconds) => ({
                value: String(seconds),
                label: t('{count} s', { count: seconds }),
              }))}
            />
          </LabeledField>
          <Button
            variant="outline"
            color="neutral"
            size="sm"
            loading={isTesting}
            disabled={isTesting || draft.endpointUrl.length === 0}
            onClick={() => void testConnection()}
          >
            {t('Test connection')}
          </Button>
        </div>
        {testResult !== null && (
          <span
            style={{
              color: testResult.ok
                ? LEVEL_STYLES.OK.ink
                : LEVEL_STYLES.CRITICAL.ink,
            }}
          >
            {testResult.ok
              ? t(
                  '{status} OK · {latency} · {nodes} nodes, {processes} processes',
                  {
                    status: testResult.httpStatus ?? '',
                    latency: formatMilliseconds(testResult.latencyMs),
                    nodes: testResult.nodeCount,
                    processes: testResult.processCount,
                  },
                )
              : t('Error: {error}', { error: testResult.error ?? '' })}
          </span>
        )}
      </Section>

      <Section
        title={t('Alert recipients')}
        subtitle={t(
          'Only the people on this list get emails. Each picks the lowest level they want.',
        )}
      >
        <RecipientsEditor
          recipients={draft.recipients}
          extraEmails={draft.extraEmails}
          members={source.members}
          onAddRecipient={(memberId) =>
            update((current) => ({
              recipients: current.recipients.some(
                (recipient) => recipient.memberId === memberId,
              )
                ? current.recipients
                : [...current.recipients, { memberId, minSeverity: 'WARNING' }],
            }))
          }
          onRemoveRecipient={(memberId) =>
            update((current) => ({
              recipients: current.recipients.filter(
                (recipient) => recipient.memberId !== memberId,
              ),
            }))
          }
          onChangeSeverity={(memberId, minSeverity) =>
            update((current) => ({
              recipients: current.recipients.map((recipient) =>
                recipient.memberId === memberId
                  ? { ...recipient, minSeverity }
                  : recipient,
              ),
            }))
          }
          onAddEmail={(email) =>
            update((current) => ({
              extraEmails: [
                ...new Set([...current.extraEmails, email.toLowerCase()]),
              ],
            }))
          }
          onRemoveEmail={(email) =>
            update((current) => ({
              extraEmails: current.extraEmails.filter(
                (candidate) => candidate !== email,
              ),
            }))
          }
        />
      </Section>

      <Section
        title={t('Snapshot history')}
        subtitle={t(
          'Each poll stores a trimmed snapshot. Charts read from it.',
        )}
      >
        <SegmentedControl
          aria-label={t('Keep snapshots for')}
          itemWidth="equal"
          value={String(draft.snapshotRetentionHours)}
          onValueChange={(value) =>
            update({ snapshotRetentionHours: Number(value) })
          }
          options={RETENTION_HOUR_OPTIONS.map((hours) => ({
            value: String(hours),
            label: formatRangeLabel(hours),
          }))}
        />
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textSecondary,
          }}
        >
          {t(
            'About {rows} snapshots, {size} MB · old snapshots are removed hourly · incidents are kept 90 days',
            {
              rows: formatCount(
                Math.round(draft.snapshotRetentionHours * pollsPerHour),
              ),
              size: Math.max(
                1,
                Math.round(
                  (draft.snapshotRetentionHours *
                    pollsPerHour *
                    SNAPSHOT_KILOBYTES) /
                    1024,
                ),
              ),
            },
          )}
        </span>
      </Section>

      <Section title={t('Alert policy')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(3) }}>
          <LabeledField
            label={t('Open an incident after (polls in a row)')}
            grow
          >
            <TextInput
              type="number"
              ariaLabel={t('Open an incident after')}
              width={80}
              value={String(draft.openAfterBreaches)}
              onChange={(value) => {
                const parsed = readInteger(value);
                if (parsed !== null) update({ openAfterBreaches: parsed });
              }}
            />
          </LabeledField>
          <LabeledField label={t('Remind every (minutes)')} grow>
            <TextInput
              type="number"
              ariaLabel={t('Remind every')}
              width={80}
              value={String(draft.renotifyMinutes)}
              onChange={(value) => {
                const parsed = readInteger(value);
                if (parsed !== null) update({ renotifyMinutes: parsed });
              }}
            />
          </LabeledField>
          <LabeledField label={t('Unreachable after (failures)')} grow>
            <TextInput
              type="number"
              ariaLabel={t('Unreachable after')}
              width={80}
              value={String(draft.unreachableAfterFailures)}
              onChange={(value) => {
                const parsed = readInteger(value);
                if (parsed !== null)
                  update({ unreachableAfterFailures: parsed });
              }}
            />
          </LabeledField>
        </div>
        <CheckboxField
          label={t('Email on recovery')}
          checked={draft.sendRecovery}
          onToggle={() =>
            update((current) => ({ sendRecovery: !current.sendRecovery }))
          }
        />
        <CheckboxField
          label={t('Outside 08:00 to 19:00, send critical alerts only')}
          hint={t(
            'Held-back warnings go out at the start of working hours if still open.',
          )}
          checked={draft.criticalOnlyOffHours}
          onToggle={() =>
            update((current) => ({
              criticalOnlyOffHours: !current.criticalOnlyOffHours,
            }))
          }
        />
      </Section>

      <Section title={t('Thresholds')}>
        <RulesEditor
          rules={draft.rules}
          knownNodeKeys={knownNodeKeys}
          knownServiceNames={source.knownServiceNames}
          onChangeRule={changeRule}
          onRemoveRule={(ruleId) =>
            update((current) => ({
              rules: current.rules.filter((rule) => rule.id !== ruleId),
            }))
          }
          onAddRule={addRule}
        />
      </Section>

      {knownNodeKeys.length > 0 && (
        <Section
          title={t('Nodes')}
          subtitle={t(
            'Name each node the way your team says it. Uncheck a node to mute its alerts; it stays on the dashboard.',
          )}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {knownNodeKeys.map((nodeKey) => (
              <div
                key={nodeKey}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  columnGap: spacing(3),
                  rowGap: spacing(1.5),
                  padding: `${spacing(2)} 0`,
                  borderTop: `1px solid ${HEALTH_TOKENS.borderLight}`,
                }}
              >
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <CheckboxField
                    label={nodeKey}
                    checked={!draft.mutedNodeKeys.includes(nodeKey)}
                    onToggle={() =>
                      update((current) => ({
                        mutedNodeKeys: current.mutedNodeKeys.includes(nodeKey)
                          ? current.mutedNodeKeys.filter(
                              (key) => key !== nodeKey,
                            )
                          : [...current.mutedNodeKeys, nodeKey],
                      }))
                    }
                  />
                </div>
                <div style={{ flex: '2 1 220px', minWidth: 0 }}>
                  <TextInput
                    ariaLabel={t('Display name for {node}', { node: nodeKey })}
                    placeholder={formatNodeLabel(nodeKey)}
                    value={draft.nodeLabels[nodeKey] ?? ''}
                    onChange={(value) =>
                      update((current) => {
                        const nodeLabels = { ...current.nodeLabels };

                        if (value.trim().length > 0) {
                          nodeLabels[nodeKey] = value;
                        } else {
                          delete nodeLabels[nodeKey];
                        }

                        return { nodeLabels };
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </DrawerShell>
  );
};
