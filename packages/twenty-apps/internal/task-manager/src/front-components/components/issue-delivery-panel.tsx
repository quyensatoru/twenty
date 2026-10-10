import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconRocket } from 'twenty-ui/icon';

import { type DevelopmentDeliveryRow } from '../../types/development-delivery';
import { summarizeDevelopmentDeliveries } from '../../utils/summarize-development-deliveries.util';
import { formatDateTimeLabel } from '../utils/format-date-time-label.util';
import { DevelopmentSection } from './development-section';
import { DevelopmentStatus } from './development-status';
import { TaskCopyLinkButton } from './task-copy-link-button';
import { TASK_TOKENS } from './task-tokens';

type IssueDeliveryPanelProps = {
  deliveries: DevelopmentDeliveryRow[];
  repositoryNames: Map<string, string>;
};

export const IssueDeliveryPanel = ({
  deliveries,
  repositoryNames,
}: IssueDeliveryPanelProps) => {
  const { builds, environments } = summarizeDevelopmentDeliveries(deliveries);
  return (
    <div style={{ minWidth: 0 }}>
      {[
        { title: t('Builds'), rows: builds, Icon: IconCheck },
        { title: t('Deployments'), rows: environments, Icon: IconRocket },
      ].map(({ title, rows, Icon }) => (
        <DevelopmentSection
          key={title}
          title={title}
          icon={<Icon size={16} />}
          count={rows.length}
          initiallyOpen={rows.length > 0}
          summary={rows.length === 0 ? t('No activity') : undefined}
        >
          {rows.length === 0 ? (
            <p
              style={{
                color: TASK_TOKENS.textTertiary,
                fontSize: 12,
                margin: '4px 0 0',
                lineHeight: 1.5,
              }}
            >
              {title === t('Deployments')
                ? t('No deployment reported for this issue.')
                : t('No build reported for this issue.')}
            </p>
          ) : (
            rows.map((delivery, index) => (
              <div
                key={delivery.id}
                style={{
                  alignItems: 'flex-start',
                  borderTop:
                    index === 0
                      ? undefined
                      : `1px solid ${TASK_TOKENS.borderLight}`,
                  display: 'flex',
                  gap: 8,
                  padding: '10px 0',
                  minWidth: 0,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '4px 8px',
                    }}
                  >
                    <span
                      title={delivery.environmentName ?? delivery.title}
                      style={{
                        color: TASK_TOKENS.textPrimary,
                        fontSize: 13,
                        fontWeight: 500,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {delivery.environmentName ?? delivery.title}
                    </span>
                    <DevelopmentStatus status={delivery.status} />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '2px 6px',
                      color: TASK_TOKENS.textTertiary,
                      fontSize: 11,
                      lineHeight: 1.6,
                      marginTop: 4,
                    }}
                  >
                    {delivery.deliveryType === 'DEPLOYMENT' &&
                      delivery.environmentType === 'PRODUCTION' && (
                        <span style={{ color: TASK_TOKENS.textSecondary }}>
                          {t('Production')} ·
                        </span>
                      )}
                    <span style={{ overflowWrap: 'anywhere' }}>
                      {repositoryNames.get(delivery.repositoryId ?? '') ??
                        t('Unlinked repository')}
                    </span>
                    <span>· {formatDateTimeLabel(delivery.occurredAt)}</span>
                    {delivery.commitSha !== null && (
                      <span
                        title={delivery.commitSha}
                        style={{ fontFamily: 'monospace' }}
                      >
                        · {delivery.commitSha.slice(0, 7)}
                      </span>
                    )}
                  </div>
                </div>
                {delivery.url !== null && (
                  <TaskCopyLinkButton
                    url={delivery.url}
                    label={t('Copy log link')}
                  />
                )}
              </div>
            ))
          )}
        </DevelopmentSection>
      ))}
    </div>
  );
};
