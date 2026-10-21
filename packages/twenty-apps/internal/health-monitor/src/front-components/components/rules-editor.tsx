import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { Button, Switch } from 'twenty-ui/primitives/input';

import {
  HEALTH_METRIC_LABELS,
  HEALTH_METRIC_UNITS,
} from '../../constants/health-metric-labels';
import { type HealthRuleMetric } from '../../types/health-metric';
import { type HealthRule } from '../../types/health-rule';
import { useIsMobile } from '../hooks/use-is-mobile';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';
import { TextInput } from './text-input';

type RulePatch =
  | Partial<HealthRule>
  | ((rule: HealthRule) => Partial<HealthRule>);

type RulesEditorProps = {
  rules: HealthRule[];
  knownNodeKeys: string[];
  knownServiceNames: string[];
  onChangeRule: (ruleId: string, patch: RulePatch) => void;
  onRemoveRule: (ruleId: string) => void;
  onAddRule: (metric: HealthRuleMetric) => void;
};

const STATUS_METRICS: HealthRuleMetric[] = ['NODE_STATUS', 'SERVICE_STATUS'];
const SERVICE_METRICS: HealthRuleMetric[] = [
  'SERVICE_STATUS',
  'SERVICE_RESTARTS',
  'SERVICE_MEMORY',
  'SERVICE_CPU',
];
const ADDABLE_METRICS: HealthRuleMetric[] = [
  'NODE_CPU',
  'NODE_MEMORY',
  'NODE_DISK',
  'SERVICE_MEMORY',
  'SERVICE_CPU',
  'SERVICE_RESTARTS',
];

const readNumberInput = (text: string): number | null => {
  const normalized = text.trim().replace(',', '.');

  if (normalized.length === 0) {
    return null;
  }

  const value = Number(normalized);

  return Number.isFinite(value) ? value : null;
};

const GRID_COLUMNS =
  'minmax(130px, 1.3fr) minmax(96px, 1fr) minmax(96px, 1fr) 100px 100px 52px 36px';

const ThresholdInput = ({
  level,
  value,
  unit,
  onChange,
}: {
  level: 'WARNING' | 'CRITICAL';
  value: number | null;
  unit: string;
  onChange: (value: number | null) => void;
}) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
    <TextInput
      ariaLabel={
        level === 'WARNING' ? t('Warning threshold') : t('Critical threshold')
      }
      value={value === null ? '' : String(value)}
      width={60}
      onChange={(text) => onChange(readNumberInput(text))}
    />
    <span
      style={{
        fontSize: HEALTH_TOKENS.fontSizeSm,
        color: HEALTH_TOKENS.textTertiary,
      }}
    >
      {unit}
    </span>
  </span>
);

// Cells carry their own right padding instead of a column gap, so each row's
// top border runs unbroken across the grid.
const CELL_PADDING_RIGHT = spacing(2.5);

const HeaderCell = ({
  children,
  color,
}: {
  children?: string;
  color?: string;
}) => (
  <span
    style={{
      fontSize: HEALTH_TOKENS.fontSizeSm,
      fontWeight: HEALTH_TOKENS.fontWeightMedium,
      color: color ?? HEALTH_TOKENS.textTertiary,
      padding: `0 ${CELL_PADDING_RIGHT} ${spacing(2)} 0`,
    }}
  >
    {children}
  </span>
);

const EmptyCell = () => (
  <span style={{ color: HEALTH_TOKENS.textTertiary }}>–</span>
);

const readRuleHint = (rule: HealthRule): string | null => {
  if (rule.metric === 'NODE_STATUS')
    return t('Critical when not "ok" or missing from the payload');
  if (rule.metric === 'SERVICE_STATUS') return t('Critical when not "online"');
  if (rule.metric === 'SERVICE_RESTARTS') return t('since the previous poll');

  return rule.scopeNodeKey !== null || rule.scopeServiceName !== null
    ? t('Overrides the general rule')
    : null;
};

type RuleRowProps = {
  rule: HealthRule;
  onChangeRule: (ruleId: string, patch: RulePatch) => void;
  onRemoveRule: (ruleId: string) => void;
};

const MobileField = ({
  label,
  children,
  isFullWidth = false,
}: {
  label: string;
  children: ReactNode;
  isFullWidth?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(1),
      minWidth: 0,
      gridColumn: isFullWidth ? '1 / -1' : undefined,
    }}
  >
    <span
      style={{
        fontSize: HEALTH_TOKENS.fontSizeSm,
        color: HEALTH_TOKENS.textTertiary,
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

// Phones get one card per rule: seven columns do not fit a narrow screen.
const MobileRuleCard = ({ rule, onChangeRule, onRemoveRule }: RuleRowProps) => {
  const isStatus = STATUS_METRICS.includes(rule.metric);
  const isService = SERVICE_METRICS.includes(rule.metric);
  const unit = HEALTH_METRIC_UNITS[rule.metric].trim();
  const hint = readRuleHint(rule);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing(2.5),
        padding: spacing(3),
        border: `1px solid ${HEALTH_TOKENS.border}`,
        borderRadius: HEALTH_TOKENS.radius,
        background: HEALTH_TOKENS.background,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
        <span
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: 0,
            opacity: rule.isEnabled ? 1 : 0.5,
          }}
        >
          <span style={{ fontWeight: HEALTH_TOKENS.fontWeightMedium }}>
            {t(HEALTH_METRIC_LABELS[rule.metric])}
          </span>
          {hint !== null && (
            <span
              style={{
                fontSize: HEALTH_TOKENS.fontSizeSm,
                color: isStatus
                  ? LEVEL_STYLES.CRITICAL.ink
                  : HEALTH_TOKENS.textTertiary,
              }}
            >
              {hint}
            </span>
          )}
        </span>
        <Switch
          aria-label={t('Rule enabled')}
          size="sm"
          style={{ alignSelf: 'center' }}
          checked={rule.isEnabled}
          onCheckedChange={() =>
            onChangeRule(rule.id, (current) => ({
              isEnabled: !current.isEnabled,
            }))
          }
        />
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label={t('Delete rule')}
          startIcon={<IconTrash size={16} />}
          onClick={() => onRemoveRule(rule.id)}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: spacing(2.5),
          opacity: rule.isEnabled ? 1 : 0.5,
        }}
      >
        <MobileField label={t('Node')} isFullWidth={!isService}>
          <TextInput
            ariaLabel={t('Applies to node')}
            placeholder={t('every node')}
            value={rule.scopeNodeKey ?? ''}
            onChange={(value) =>
              onChangeRule(rule.id, {
                scopeNodeKey: value.trim().length > 0 ? value.trim() : null,
              })
            }
          />
        </MobileField>
        {isService && (
          <MobileField label={t('Process')}>
            <TextInput
              ariaLabel={t('Applies to process')}
              placeholder={t('every process')}
              value={rule.scopeServiceName ?? ''}
              onChange={(value) =>
                onChangeRule(rule.id, {
                  scopeServiceName:
                    value.trim().length > 0 ? value.trim() : null,
                })
              }
            />
          </MobileField>
        )}
        {!isStatus && (
          <>
            <MobileField label={t('Warning ≥')}>
              <ThresholdInput
                level="WARNING"
                value={rule.warningValue}
                unit={unit}
                onChange={(warningValue) =>
                  onChangeRule(rule.id, { warningValue })
                }
              />
            </MobileField>
            <MobileField label={t('Critical ≥')}>
              <ThresholdInput
                level="CRITICAL"
                value={rule.criticalValue}
                unit={unit}
                onChange={(criticalValue) =>
                  onChangeRule(rule.id, { criticalValue })
                }
              />
            </MobileField>
          </>
        )}
      </div>
    </div>
  );
};

export const RulesEditor = ({
  rules,
  knownNodeKeys,
  knownServiceNames,
  onChangeRule,
  onRemoveRule,
  onAddRule,
}: RulesEditorProps) => {
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3) }}>
      {isMobile ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}
        >
          {rules.map((rule) => (
            <MobileRuleCard
              key={rule.id}
              rule={rule}
              onChangeRule={onChangeRule}
              onRemoveRule={onRemoveRule}
            />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              minWidth: 600,
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              alignItems: 'stretch',
            }}
          >
            <HeaderCell>{t('Metric')}</HeaderCell>
            <HeaderCell>{t('Node')}</HeaderCell>
            <HeaderCell>{t('Process')}</HeaderCell>
            <HeaderCell color={LEVEL_STYLES.WARNING.ink}>
              {t('Warning ≥')}
            </HeaderCell>
            <HeaderCell color={LEVEL_STYLES.CRITICAL.ink}>
              {t('Critical ≥')}
            </HeaderCell>
            <HeaderCell>{t('On')}</HeaderCell>
            <span />
            {rules.map((rule) => {
              const isStatus = STATUS_METRICS.includes(rule.metric);
              const isService = SERVICE_METRICS.includes(rule.metric);
              const unit = HEALTH_METRIC_UNITS[rule.metric].trim();
              const rowCell = {
                borderTop: `1px solid ${HEALTH_TOKENS.borderLight}`,
                padding: `${spacing(2)} ${CELL_PADDING_RIGHT} ${spacing(2)} 0`,
                display: 'flex',
                alignItems: 'center',
                opacity: rule.isEnabled ? 1 : 0.5,
                minWidth: 0,
              } as const;
              const hint = readRuleHint(rule);

              return (
                <div key={rule.id} style={{ display: 'contents' }}>
                  <span
                    style={{
                      ...rowCell,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      gap: '2px',
                    }}
                  >
                    <span
                      style={{ fontWeight: HEALTH_TOKENS.fontWeightMedium }}
                    >
                      {t(HEALTH_METRIC_LABELS[rule.metric])}
                    </span>
                    {hint !== null && (
                      <span
                        style={{
                          fontSize: HEALTH_TOKENS.fontSizeSm,
                          color: isStatus
                            ? LEVEL_STYLES.CRITICAL.ink
                            : HEALTH_TOKENS.textTertiary,
                        }}
                      >
                        {hint}
                      </span>
                    )}
                  </span>
                  <span style={rowCell}>
                    <TextInput
                      ariaLabel={t('Applies to node')}
                      placeholder={t('every node')}
                      value={rule.scopeNodeKey ?? ''}
                      onChange={(value) =>
                        onChangeRule(rule.id, {
                          scopeNodeKey:
                            value.trim().length > 0 ? value.trim() : null,
                        })
                      }
                    />
                  </span>
                  <span style={rowCell}>
                    {isService ? (
                      <TextInput
                        ariaLabel={t('Applies to process')}
                        placeholder={t('every process')}
                        value={rule.scopeServiceName ?? ''}
                        onChange={(value) =>
                          onChangeRule(rule.id, {
                            scopeServiceName:
                              value.trim().length > 0 ? value.trim() : null,
                          })
                        }
                      />
                    ) : (
                      <EmptyCell />
                    )}
                  </span>
                  <span style={rowCell}>
                    {isStatus ? (
                      <EmptyCell />
                    ) : (
                      <ThresholdInput
                        level="WARNING"
                        value={rule.warningValue}
                        unit={unit}
                        onChange={(warningValue) =>
                          onChangeRule(rule.id, { warningValue })
                        }
                      />
                    )}
                  </span>
                  <span style={rowCell}>
                    {isStatus ? (
                      <EmptyCell />
                    ) : (
                      <ThresholdInput
                        level="CRITICAL"
                        value={rule.criticalValue}
                        unit={unit}
                        onChange={(criticalValue) =>
                          onChangeRule(rule.id, { criticalValue })
                        }
                      />
                    )}
                  </span>
                  <span style={{ ...rowCell, opacity: 1 }}>
                    <Switch
                      aria-label={t('Rule enabled')}
                      size="sm"
                      style={{ alignSelf: 'center' }}
                      checked={rule.isEnabled}
                      onCheckedChange={() =>
                        onChangeRule(rule.id, (current) => ({
                          isEnabled: !current.isEnabled,
                        }))
                      }
                    />
                  </span>
                  <span style={{ ...rowCell, opacity: 1 }}>
                    <Button
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      aria-label={t('Delete rule')}
                      startIcon={<IconTrash size={16} />}
                      onClick={() => onRemoveRule(rule.id)}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing(1.5),
        }}
      >
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textSecondary,
          }}
        >
          {t('Add a rule:')}
        </span>
        {ADDABLE_METRICS.map((metric) => (
          <Button
            key={metric}
            variant="outline"
            color="neutral"
            size="sm"
            startIcon={<IconPlus size={16} />}
            onClick={() => onAddRule(metric)}
          >
            {t(HEALTH_METRIC_LABELS[metric])}
          </Button>
        ))}
      </div>
      {(knownNodeKeys.length > 0 || knownServiceNames.length > 0) && (
        <span
          style={{
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textTertiary,
          }}
        >
          {t(
            'Nodes: {nodes}. Processes: {processes}. A rule naming a node or process replaces the general rule for it.',
            {
              nodes: knownNodeKeys.join(', '),
              processes: knownServiceNames.join(', '),
            },
          )}
        </span>
      )}
    </div>
  );
};
