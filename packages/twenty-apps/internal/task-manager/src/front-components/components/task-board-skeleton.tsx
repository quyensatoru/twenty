import { type BoardViewMode, type PageInset } from '../../types/task-board';
import { readStoredColumnWidth } from './task-board-view';
import { TASK_TOKENS } from './task-tokens';
import {
  TaskSkeletonBar,
  TaskSkeletonFieldRow,
  TaskSkeletonLines,
} from './task-skeleton';

// What the page looks like while its first route round trip is in flight.
// Drawn to the same measures as the loaded page (insets, header rows, control
// heights, column width) so nothing jumps when the data lands. Static like
// the other skeletons: an app ships no stylesheet for a shimmer.
export const TaskBoardSkeleton = ({
  view,
  isMobile,
  isEpicPanelOpen,
  inset,
}: {
  view: BoardViewMode;
  isMobile: boolean;
  isEpicPanelOpen: boolean;
  inset: PageInset;
}) => (
  <div
    aria-hidden="true"
    style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        gap: 10,
        padding: `12px ${inset.right}px 12px ${inset.left}px`,
      }}
    >
      {isMobile ? (
        <>
          <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <TaskSkeletonBar
              height={CONTROL_HEIGHT}
              radius={TASK_TOKENS.radiusSmall}
              style={{ flex: 1 }}
            />
            <TaskSkeletonBar
              width={64}
              height={CONTROL_HEIGHT}
              radius={TASK_TOKENS.radiusSmall}
            />
            <TaskSkeletonBar
              width={CONTROL_HEIGHT}
              height={CONTROL_HEIGHT}
              radius={TASK_TOKENS.radiusSmall}
            />
          </div>
          <TaskSkeletonBar height={36} radius={TASK_TOKENS.radiusSmall} />
        </>
      ) : (
        <div
          style={{
            alignItems: 'center',
            columnGap: 16,
            display: 'grid',
            gridTemplateColumns:
              'minmax(max-content, 1fr) minmax(240px, 560px) minmax(max-content, 1fr)',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <TaskSkeletonBar
              width={190}
              height={CONTROL_HEIGHT}
              radius={TASK_TOKENS.radiusSmall}
            />
            <TaskSkeletonBar
              width={172}
              height={CONTROL_HEIGHT}
              radius={TASK_TOKENS.radiusSmall}
            />
          </div>
          <TaskSkeletonBar height={40} radius={TASK_TOKENS.radiusSmall} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TaskSkeletonBar
              width={122}
              height={CONTROL_HEIGHT}
              radius={TASK_TOKENS.radiusSmall}
            />
          </div>
        </div>
      )}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          minHeight: CONTROL_HEIGHT,
        }}
      >
        <TaskSkeletonBar
          width={78}
          height={CONTROL_HEIGHT}
          radius={TASK_TOKENS.radiusSmall}
        />
        <TaskSkeletonBar width={28} height={28} radius="50%" />
        <TaskSkeletonBar
          width={120}
          height={CONTROL_HEIGHT}
          radius={TASK_TOKENS.radiusSmall}
        />
        <TaskSkeletonBar
          width={130}
          height={CONTROL_HEIGHT}
          radius={TASK_TOKENS.radiusSmall}
        />
        {view === 'board' && (
          <TaskSkeletonBar
            width={170}
            height={CONTROL_HEIGHT}
            radius={TASK_TOKENS.radiusSmall}
          />
        )}
        {view === 'board' && !isMobile && (
          <>
            <span style={{ flex: 1 }} />
            <TaskSkeletonBar width={260} height={12} />
          </>
        )}
      </div>
    </div>

    {/* The sprint strip or its "no active sprint" banner: one of the two is
        always there on the board. */}
    {view === 'board' && (
      <TaskSkeletonBar
        height={38}
        background={TASK_TOKENS.backgroundSecondary}
        radius={TASK_TOKENS.radiusSmall}
        style={{
          border: `1px solid ${TASK_TOKENS.borderLight}`,
          boxSizing: 'border-box',
          flexShrink: 0,
          margin: `0 ${inset.right}px 12px ${inset.left}px`,
          width: 'auto',
        }}
      />
    )}

    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {isEpicPanelOpen && (
        <TaskEpicPanelSkeleton isFullScreen={isMobile} inset={inset} />
      )}
      {!(isEpicPanelOpen && isMobile) &&
        (view === 'board' ? (
          <TaskBoardColumnsSkeleton inset={inset} />
        ) : (
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              minWidth: 0,
              padding: `0 ${inset.right}px ${inset.right}px ${inset.left}px`,
            }}
          >
            <TaskBacklogSkeleton />
          </div>
        ))}
    </div>
  </div>
);

const CONTROL_HEIGHT = 32;

const TaskBoardColumnsSkeleton = ({ inset }: { inset: PageInset }) => {
  const columnWidth = readStoredColumnWidth();

  return (
    <div
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        flex: 1,
        gap: 12,
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        padding: `0 ${inset.right}px ${inset.right}px ${inset.left}px`,
      }}
    >
      {[3, 2, 2, 1, 1].map((cardCount, column) => (
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
            // The width the reader last dragged the columns to, as the loaded
            // board will draw them.
            width: columnWidth,
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              gap: 8,
              padding: '12px 12px 8px 24px',
            }}
          >
            <TaskSkeletonBar width={8} height={8} radius="50%" />
            <TaskSkeletonBar width={88} />
            <span style={{ flex: 1 }} />
            <TaskSkeletonBar
              width={16}
              height={16}
              radius={TASK_TOKENS.radiusExtraSmall}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '4px 8px 8px 8px',
            }}
          >
            {Array.from({ length: cardCount }, (_, card) => (
              <div
                key={card}
                style={{
                  background: TASK_TOKENS.background,
                  border: `1px solid ${TASK_TOKENS.border}`,
                  borderRadius: TASK_TOKENS.radius,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '10px 12px',
                }}
              >
                <TaskSkeletonBar width="70%" />
                <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
                  <TaskSkeletonBar
                    width={14}
                    height={14}
                    radius={TASK_TOKENS.radiusExtraSmall}
                  />
                  <TaskSkeletonBar width={48} />
                  <span style={{ flex: 1 }} />
                  <TaskSkeletonBar width={22} height={22} radius="50%" />
                </div>
              </div>
            ))}
            <TaskSkeletonBar
              width={96}
              height={12}
              style={{ margin: '10px 8px' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// The backlog's sections while they load: a sprint, the "Create sprint"
// button, then the backlog, each a header, a few rows at the loaded rows'
// height and the inline create under them.
export const TaskBacklogSkeleton = () => (
  <div
    aria-hidden="true"
    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
  >
    <TaskBacklogSectionSkeleton rowCount={2} />
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <TaskSkeletonBar
        width={106}
        height={CONTROL_HEIGHT}
        radius={TASK_TOKENS.radiusSmall}
      />
    </div>
    <TaskBacklogSectionSkeleton rowCount={3} />
  </div>
);

const TaskBacklogSectionSkeleton = ({ rowCount }: { rowCount: number }) => (
  <div
    style={{
      background: TASK_TOKENS.backgroundSecondary,
      border: `1px solid ${TASK_TOKENS.borderLight}`,
      borderRadius: TASK_TOKENS.radius,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 8,
        minHeight: 44,
        padding: '0 12px',
      }}
    >
      <TaskSkeletonBar
        width={16}
        height={16}
        radius={TASK_TOKENS.radiusExtraSmall}
      />
      <TaskSkeletonBar width={120} height={14} />
      <span style={{ flex: 1 }} />
      <TaskSkeletonBar width={24} height={18} radius="10px" />
    </div>
    <div
      style={{
        background: TASK_TOKENS.background,
        borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
      }}
    >
      {Array.from({ length: rowCount }, (_, row) => (
        <div
          key={row}
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
            minHeight: 38,
            padding: '0 12px',
          }}
        >
          <TaskSkeletonBar
            width={14}
            height={14}
            radius={TASK_TOKENS.radiusExtraSmall}
          />
          <TaskSkeletonBar width={44} />
          <TaskSkeletonBar width={`${[40, 28, 34][row % 3]}%`} />
          <span style={{ flex: 1 }} />
          <TaskSkeletonBar
            width={56}
            height={18}
            radius={TASK_TOKENS.radiusExtraSmall}
          />
          <TaskSkeletonBar width={22} height={22} radius="50%" />
        </div>
      ))}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          height: 40,
          padding: '0 16px',
        }}
      >
        <TaskSkeletonBar width={96} />
      </div>
    </div>
  </div>
);

const TaskEpicPanelSkeleton = ({
  isFullScreen,
  inset,
}: {
  isFullScreen: boolean;
  inset: PageInset;
}) => (
  <div
    style={{
      borderRight: isFullScreen
        ? 'none'
        : `1px solid ${TASK_TOKENS.borderLight}`,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      gap: 10,
      padding: `4px ${inset.right}px 12px ${inset.left}px`,
      width: isFullScreen ? '100%' : 280,
    }}
  >
    <TaskSkeletonBar width={56} height={14} />
    <TaskSkeletonBar height={CONTROL_HEIGHT} radius={TASK_TOKENS.radiusSmall} />
    <TaskSkeletonBar width="60%" />
    {[0, 1].map((epic) => (
      <TaskSkeletonBar
        key={epic}
        height={56}
        background={TASK_TOKENS.backgroundSecondary}
        radius={TASK_TOKENS.radiusSmall}
        style={{ border: `1px solid ${TASK_TOKENS.borderLight}` }}
      />
    ))}
  </div>
);

// What the issue modal looks like while the detail route is in flight: the
// header row, a title bar, the description box and the activity tabs on the
// left, the Details rows on the right (under them on a phone, as the loaded
// modal stacks). Rendered inside TaskBoardDetailFrame, which already owns the
// backdrop, the dialog and the close button.
export const TaskBoardDetailSkeleton = ({
  isMobile,
}: {
  isMobile: boolean;
}) => (
  <div
    aria-hidden="true"
    style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
  >
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: isMobile ? 4 : 8,
        padding: isMobile ? '12px 12px 8px 16px' : '16px 20px 12px 20px',
      }}
    >
      <TaskSkeletonBar
        width={64}
        height={22}
        radius={TASK_TOKENS.radiusSmall}
      />
      <TaskSkeletonBar width={48} />
      <span style={{ flex: 1 }} />
      <TaskSkeletonBar
        width={24}
        height={24}
        radius={TASK_TOKENS.radiusSmall}
      />
      <TaskSkeletonBar
        width={24}
        height={24}
        radius={TASK_TOKENS.radiusSmall}
      />
      <TaskSkeletonBar
        width={24}
        height={24}
        radius={TASK_TOKENS.radiusSmall}
      />
      <TaskSkeletonBar
        width={24}
        height={24}
        radius={TASK_TOKENS.radiusSmall}
      />
    </div>
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 20,
        padding: isMobile ? '12px 16px 16px 16px' : '12px 20px 20px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          gap: 16,
          minWidth: 0,
        }}
      >
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
          <TaskSkeletonBar
            width={92}
            height={28}
            radius={TASK_TOKENS.radiusSmall}
          />
          <TaskSkeletonBar
            width={92}
            height={28}
            radius={TASK_TOKENS.radiusSmall}
          />
          <TaskSkeletonBar
            width={76}
            height={28}
            radius={TASK_TOKENS.radiusSmall}
          />
        </div>
        <TaskSkeletonLines widths={[90, 70]} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: isMobile ? '100%' : 280,
        }}
      >
        <TaskSkeletonBar width={64} />
        {[60, 45, 55, 40, 50, 35].map((valueWidth, index) => (
          <TaskSkeletonFieldRow key={index} valueWidth={valueWidth} />
        ))}
      </div>
    </div>
  </div>
);
