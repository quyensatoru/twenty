import { type CSSProperties } from 'react';
import { t } from 'twenty-sdk/front-component';

import { TaskSkeletonBar } from './task-skeleton';
import { TASK_TOKENS } from './task-tokens';

type TaskTodayWorkLayoutProps = {
  isDeskView: boolean;
  isMobile: boolean;
};

export const getTaskTodayWorkGridStyle = ({
  isDeskView,
  isMobile,
}: TaskTodayWorkLayoutProps): CSSProperties => ({
  margin: 0,
  padding: isDeskView
    ? isMobile
      ? '20px 16px 30px'
      : '26px 24px 36px'
    : '16px 20px 24px',
  display: 'grid',
  gridTemplateColumns:
    isDeskView && !isMobile ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
  gap: isDeskView ? 26 : 12,
  background: isDeskView
    ? `linear-gradient(135deg, color-mix(in srgb, ${TASK_TOKENS.background} 87%, #bae6fd), color-mix(in srgb, ${TASK_TOKENS.background} 86%, #a7f3d0))`
    : 'transparent',
  perspective: '1200px',
});

export const getTaskTodayPaperColor = (layer: number): string =>
  `color-mix(in srgb, ${TASK_TOKENS.background} ${layer === 1 ? 75 : 58}%, ${layer === 1 ? '#bae6fd' : '#a7f3d0'})`;

export const TaskTodayWorkSkeleton = ({
  isDeskView,
  isMobile,
}: TaskTodayWorkLayoutProps) => (
  <div
    role="status"
    aria-label={t('Loading your work')}
    style={getTaskTodayWorkGridStyle({ isDeskView, isMobile })}
  >
    {Array.from({ length: isDeskView && !isMobile ? 4 : 2 }, (_, position) => (
      <div
        key={position}
        aria-hidden="true"
        style={{ position: 'relative', minWidth: 0 }}
      >
        {isDeskView &&
          [1, 2].map((layer) => (
            <div
              key={layer}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 14,
                border: `1px solid ${TASK_TOKENS.borderStrong}`,
                background: getTaskTodayPaperColor(layer),
                transform: `translate(${layer * 2}px, ${layer * 5}px) rotate(${(position % 2 ? -1 : 1) * layer * 0.65}deg)`,
              }}
            />
          ))}
        <div
          style={{
            position: 'relative',
            boxSizing: 'border-box',
            minHeight: isDeskView ? 276 : 208,
            padding: isDeskView ? 20 : 16,
            borderRadius: isDeskView ? 14 : 10,
            border: `1px solid ${TASK_TOKENS.borderStrong}`,
            background: TASK_TOKENS.background,
            boxShadow: '0 3px 7px rgba(24,24,27,.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <TaskSkeletonBar width={48} height={10} />
            <TaskSkeletonBar width={18} height={10} />
          </div>
          <TaskSkeletonBar width="86%" height={isDeskView ? 20 : 17} />
          {isDeskView && (
            <TaskSkeletonBar width="62%" height={20} style={{ marginTop: 7 }} />
          )}
          <div
            style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 18 }}
          >
            <TaskSkeletonBar width="30%" height={12} />
            <TaskSkeletonBar width="20%" height={12} />
            <TaskSkeletonBar width="22%" height={12} />
          </div>
          <div style={{ marginTop: 'auto' }}>
            <TaskSkeletonBar
              width={isDeskView ? '100%' : 180}
              height={30}
              radius="6px"
              style={{ maxWidth: '100%', marginBottom: 14 }}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
                paddingTop: 12,
              }}
            >
              {[60, 65, 60].map((width, index) => (
                <TaskSkeletonBar
                  key={index}
                  width={width}
                  height={30}
                  radius="7px"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
