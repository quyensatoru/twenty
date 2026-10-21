import { t } from 'twenty-sdk/front-component';

import { type HealthDashboardNode } from '../../types/health-dashboard';
import { formatMegabytes, formatPercent } from '../utils/format-health.util';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';

type ProcessMatrixProps = {
  nodes: HealthDashboardNode[];
  onSelectNode: (nodeKey: string) => void;
};

const LegendItem = ({
  label,
  background,
  border,
}: {
  label: string;
  background: string;
  border: string;
}) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: HEALTH_TOKENS.radiusSmall,
        background,
        border: `1px solid ${border}`,
      }}
    />
    {label}
  </span>
);

export const ProcessMatrix = ({ nodes, onSelectNode }: ProcessMatrixProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2.5) }}>
    {nodes.map((node) => (
      <div
        key={node.key}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          rowGap: spacing(1),
          columnGap: spacing(2.5),
        }}
      >
        <span
          style={{
            width: '100%',
            fontSize: HEALTH_TOKENS.fontSizeSm,
            color: HEALTH_TOKENS.textSecondary,
          }}
        >
          {node.label}
        </span>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>
          {node.processes.length === 0 && (
            <span
              style={{
                fontSize: HEALTH_TOKENS.fontSizeSm,
                color: HEALTH_TOKENS.textTertiary,
              }}
            >
              {t('No process')}
            </span>
          )}
          {node.processes.map((process) => {
            const level =
              process.status !== 'online'
                ? 'CRITICAL'
                : process.restartsInRange > 0
                  ? 'WARNING'
                  : 'OK';
            const details = [
              `${process.name} · pm2 ${process.pm2Id ?? '-'} · ${process.status}`,
              `CPU ${formatPercent(process.cpuPercent)} · RAM ${formatMegabytes(process.memoryMegabytes)}`,
              process.restartsInRange > 0
                ? t('{count} restarts in range', {
                    count: process.restartsInRange,
                  })
                : null,
            ].filter((part) => part !== null);

            return (
              <button
                key={process.key}
                type="button"
                onClick={() => onSelectNode(node.key)}
                title={details.join('\n')}
                aria-label={details.join(', ')}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: HEALTH_TOKENS.radiusSmall,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: HEALTH_TOKENS.fontSizeXs,
                  fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  border: `1px solid ${LEVEL_STYLES[level].fill}`,
                  background:
                    level === 'CRITICAL'
                      ? LEVEL_STYLES.CRITICAL.fill
                      : LEVEL_STYLES[level].soft,
                  color:
                    level === 'CRITICAL'
                      ? HEALTH_TOKENS.tooltipText
                      : LEVEL_STYLES[level].ink,
                }}
              >
                {process.pm2Id ?? '·'}
              </button>
            );
          })}
        </span>
      </div>
    ))}
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing(3),
        fontSize: HEALTH_TOKENS.fontSizeSm,
        color: HEALTH_TOKENS.textSecondary,
        borderTop: `1px solid ${HEALTH_TOKENS.borderLight}`,
        paddingTop: spacing(2.5),
      }}
    >
      <LegendItem
        label={t('Online')}
        background={LEVEL_STYLES.OK.soft}
        border={LEVEL_STYLES.OK.fill}
      />
      <LegendItem
        label={t('Restarted in range')}
        background={LEVEL_STYLES.WARNING.soft}
        border={LEVEL_STYLES.WARNING.fill}
      />
      <LegendItem
        label={t('Not online')}
        background={LEVEL_STYLES.CRITICAL.fill}
        border={LEVEL_STYLES.CRITICAL.fill}
      />
    </div>
  </div>
);
