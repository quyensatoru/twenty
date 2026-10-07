import { TASK_TOKENS } from './task-tokens';
import {
  TaskSkeletonBar,
  TaskSkeletonFieldRow,
  TaskSkeletonLines,
} from './task-skeleton';

// What the board looks like while its first route round trip is in flight:
// the filter bar and a row of columns with cards, all quiet bars. Static like
// the other skeletons — an app ships no stylesheet for a shimmer.
export const TaskBoardSkeleton = () => (
  <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
    <div style={{ display: 'flex', gap: 8, padding: '12px 20px 8px 20px' }}>
      <TaskSkeletonBar width={170} height={32} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={140} height={32} radius={TASK_TOKENS.radiusSmall} />
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        <TaskSkeletonBar width={400} height={32} radius={TASK_TOKENS.radiusSmall} />
      </div>
      <TaskSkeletonBar width={140} height={32} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={130} height={32} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={96} height={32} radius={TASK_TOKENS.radiusSmall} />
    </div>
    <div style={{ display: 'flex', flex: 1, gap: 12, minHeight: 0, overflow: 'hidden', padding: '0 20px 20px 20px' }}>
      {[0, 1, 2, 3].map((column) => (
        <div
          key={column}
          style={{
            background: TASK_TOKENS.backgroundSecondary,
            border: `1px solid ${TASK_TOKENS.borderLight}`,
            borderRadius: TASK_TOKENS.radius,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            gap: 8,
            padding: 8,
            width: 272,
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: 8, padding: '4px' }}>
            <TaskSkeletonBar width={8} height={8} radius="50%" />
            <TaskSkeletonBar width={96} />
            <span style={{ flex: 1 }} />
            <TaskSkeletonBar width={24} height={16} radius={TASK_TOKENS.radiusSmall} />
          </div>
          {[0, 1, 2].map((card) => (
            <div
              key={card}
              style={{
                background: TASK_TOKENS.background,
                border: `1px solid ${TASK_TOKENS.borderLight}`,
                borderRadius: TASK_TOKENS.radius,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 8,
              }}
            >
              <TaskSkeletonBar width="70%" />
              <TaskSkeletonBar width="45%" height={20} radius={TASK_TOKENS.radiusSmall} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// What the issue modal looks like while the detail route is in flight: the
// header row, a title bar, the description box and the activity tabs on the
// left, the Details rows on the right. Rendered inside TaskBoardDetailFrame,
// which already owns the backdrop, the dialog and the close button.
export const TaskBoardDetailSkeleton = () => (
  <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <div style={{ alignItems: 'center', display: 'flex', gap: 8, padding: '16px 20px 12px 20px' }}>
      <TaskSkeletonBar width={64} height={22} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={48} />
      <span style={{ flex: 1 }} />
      <TaskSkeletonBar width={24} height={24} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={24} height={24} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={24} height={24} radius={TASK_TOKENS.radiusSmall} />
      <TaskSkeletonBar width={24} height={24} radius={TASK_TOKENS.radiusSmall} />
    </div>
    <div style={{ display: 'flex', gap: 20, padding: '12px 20px 20px 20px' }}>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <TaskSkeletonBar width="55%" height={28} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TaskSkeletonBar width={96} />
          <TaskSkeletonBar
            height={120}
            background={TASK_TOKENS.backgroundSecondary}
            radius={TASK_TOKENS.radius}
            style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TaskSkeletonBar width={96} />
          <TaskSkeletonBar
            height={38}
            background={TASK_TOKENS.backgroundSecondary}
            radius={TASK_TOKENS.radius}
            style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <TaskSkeletonBar width={92} height={28} radius={TASK_TOKENS.radiusSmall} />
          <TaskSkeletonBar width={92} height={28} radius={TASK_TOKENS.radiusSmall} />
          <TaskSkeletonBar width={76} height={28} radius={TASK_TOKENS.radiusSmall} />
        </div>
        <TaskSkeletonLines widths={[90, 70]} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
        <TaskSkeletonBar width={64} />
        {[60, 45, 55, 40, 50, 35].map((valueWidth, index) => (
          <TaskSkeletonFieldRow key={index} valueWidth={valueWidth} />
        ))}
      </div>
    </div>
  </div>
);
