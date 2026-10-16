import { type CSSProperties } from 'react';

import { type BoardViewMode, type PageInset } from '../../types/task-board';
import { readStoredSideColumnWidth } from '../hooks/use-side-column-resize';
import { readStoredColumnWidth } from './task-board-view';
import {
  DETAIL_HEADER_HEIGHT,
  DETAIL_MAIN_PADDING,
  DETAIL_PAGE_MAIN_PADDING,
  DETAIL_SIDE_PADDING,
  PAGE_ISSUE_COLUMN_MIN_WIDTH,
  readModalSideColumnWidth,
  readPageSideColumnWidth,
} from './task-detail-layout';
import { TaskSkeletonBar } from './task-skeleton';
import { TASK_TOKENS } from './task-tokens';

// Measured on the loaded page: the toolbar row, the filter row under it and
// the sprint strip (or its "no active sprint" banner) on the board.
const TOOLBAR_HEIGHT = 48;
const FILTER_BAR_HEIGHT = 40;
const SPRINT_STRIP_HEIGHT = 44;
const SEARCH_HEIGHT = 36;
const SEARCH_MAX_WIDTH = 520;
const BUTTON_HEIGHT = 28;
const BACKLOG_SECTION_HEIGHT = 40;
const BACKLOG_ROW_HEIGHT = 38;
const BACKLOG_ADD_ROW_HEIGHT = 34;

const Circle = ({ size }: { size: number }) => (
  <TaskSkeletonBar width={size} height={size} radius="50%" />
);

const Button = ({ width }: { width: number }) => (
  <TaskSkeletonBar
    width={width}
    height={BUTTON_HEIGHT}
    radius={TASK_TOKENS.radiusSmall}
  />
);

const rowStyle = (style: CSSProperties): CSSProperties => ({
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  flexShrink: 0,
  ...style,
});

// What the page looks like while its first route round trip is in flight.
// Drawn to the loaded page's measures (insets, row heights, control sizes,
// the column width) so nothing jumps when the data lands. Static: an app ships
// no stylesheet for a shimmer.
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
    {/* Toolbar: project and view on the left, the search centred, the bell
        and New issue on the right. On a phone the search wraps under. */}
    <div
      style={rowStyle({
        borderBottom: `1px solid ${TASK_TOKENS.border}`,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: 8,
        minHeight: TOOLBAR_HEIGHT,
        padding: isMobile
          ? `8px ${inset.right}px 8px ${inset.left}px`
          : `0 ${inset.right}px 0 ${inset.left}px`,
      })}
    >
      <div style={rowStyle({ flex: '1 1 0', gap: 8, minWidth: 0 })}>
        <TaskSkeletonBar
          width={22}
          height={22}
          radius={TASK_TOKENS.radiusSmall}
        />
        <TaskSkeletonBar width={isMobile ? 80 : 96} height={14} />
        <span style={{ width: 8 }} />
        <Button width={isMobile ? 28 : 90} />
        <Button width={isMobile ? 28 : 77} />
      </div>
      {!isMobile && (
        <TaskSkeletonBar
          height={SEARCH_HEIGHT}
          radius={TASK_TOKENS.radiusSmall}
          background={TASK_TOKENS.backgroundSecondary}
          style={{
            border: `1px solid ${TASK_TOKENS.border}`,
            boxSizing: 'border-box',
            flex: `0 1 ${SEARCH_MAX_WIDTH}px`,
            minWidth: 240,
          }}
        />
      )}
      <div
        style={rowStyle({
          flex: isMobile ? '0 0 auto' : '1 1 0',
          gap: 8,
          justifyContent: 'flex-end',
        })}
      >
        <Button width={BUTTON_HEIGHT} />
        <Button width={isMobile ? BUTTON_HEIGHT : 104} />
      </div>
      {isMobile && (
        <TaskSkeletonBar
          height={SEARCH_HEIGHT - 8}
          radius={TASK_TOKENS.radiusSmall}
          background={TASK_TOKENS.backgroundSecondary}
          style={{
            border: `1px solid ${TASK_TOKENS.border}`,
            boxSizing: 'border-box',
            flexBasis: '100%',
          }}
        />
      )}
    </div>

    {/* Filter row: epics toggle, Filter, Only mine, the assignee faces; the
        board adds its done count, Sort and Display on the right. */}
    <div
      style={rowStyle({
        borderBottom: `1px solid ${TASK_TOKENS.border}`,
        gap: 6,
        minHeight: FILTER_BAR_HEIGHT,
        padding: `6px ${inset.right}px 6px ${inset.left}px`,
      })}
    >
      <Button width={BUTTON_HEIGHT} />
      <Button width={67} />
      <Button width={80} />
      <Circle size={24} />
      <Circle size={24} />
      {view === 'board' && !isMobile && (
        <>
          <span style={{ flex: 1 }} />
          <TaskSkeletonBar width={72} height={10} />
          <Button width={120} />
          <Button width={82} />
        </>
      )}
    </div>

    {view === 'board' && (
      <div
        style={rowStyle({
          background: TASK_TOKENS.backgroundSecondary,
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          gap: 10,
          minHeight: SPRINT_STRIP_HEIGHT,
          padding: `0 ${inset.right}px 0 ${inset.left}px`,
        })}
      >
        <TaskSkeletonBar width={16} height={16} />
        <TaskSkeletonBar width={isMobile ? '50%' : 300} height={12} />
        <span style={{ flex: 1 }} />
        {!isMobile && <TaskSkeletonBar width={84} height={12} />}
      </div>
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
            }}
          >
            <TaskBacklogSkeleton inset={inset} />
          </div>
        ))}
    </div>
  </div>
);

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
        padding: `12px ${inset.right}px ${inset.right}px ${inset.left}px`,
      }}
    >
      {[3, 2, 2, 1, 1].map((cardCount, column) => (
        <div
          key={column}
          style={{
            background: TASK_TOKENS.backgroundTransparentLighter,
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
          {/* Header: grip slot, status glyph, name, count. */}
          <div
            style={rowStyle({
              gap: 8,
              minHeight: 40,
              padding: '4px 6px 4px 18px',
            })}
          >
            <Circle size={14} />
            <TaskSkeletonBar width={[64, 48, 72, 40, 56][column]} />
            <TaskSkeletonBar width={12} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '0 6px 6px 6px',
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
                  gap: 6,
                  padding: '9px 10px',
                }}
              >
                {/* Priority, type, key, then the owner at the end. */}
                <div style={rowStyle({ gap: 6, minHeight: 20 })}>
                  <TaskSkeletonBar width={12} height={12} />
                  <TaskSkeletonBar
                    width={14}
                    height={14}
                    radius={TASK_TOKENS.radiusExtraSmall}
                  />
                  <TaskSkeletonBar width={36} height={10} />
                  <span style={{ flex: 1 }} />
                  <Circle size={20} />
                </div>
                <TaskSkeletonBar
                  width={`${[72, 54, 64][(column + card) % 3]}%`}
                  height={13}
                />
                {(column + card) % 2 === 0 && (
                  <div style={rowStyle({ gap: 4 })}>
                    <TaskSkeletonBar
                      width={84}
                      height={20}
                      radius={TASK_TOKENS.radiusExtraSmall}
                    />
                    <TaskSkeletonBar
                      width={76}
                      height={20}
                      radius={TASK_TOKENS.radiusExtraSmall}
                    />
                  </div>
                )}
              </div>
            ))}
            <div style={rowStyle({ gap: 8, minHeight: 32, padding: '0 8px' })}>
              <TaskSkeletonBar width={12} height={12} />
              <TaskSkeletonBar width={64} height={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// The backlog's sections while they load: a sprint, "Create sprint", then
// the backlog. Full width like the loaded list: a 40px tinted header, 38px
// rows on hairlines and the inline "New issue" row under them.
export const TaskBacklogSkeleton = ({ inset }: { inset: PageInset }) => (
  <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column' }}>
    <TaskBacklogSectionSkeleton inset={inset} rowCount={4} hasActions />
    <div
      style={rowStyle({
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        gap: 8,
        minHeight: 42,
        padding: `0 ${inset.right}px 0 ${inset.left + 22}px`,
      })}
    >
      <TaskSkeletonBar width={12} height={12} />
      <TaskSkeletonBar width={80} height={10} />
    </div>
    <TaskBacklogSectionSkeleton inset={inset} rowCount={3} />
  </div>
);

const TaskBacklogSectionSkeleton = ({
  inset,
  rowCount,
  hasActions = false,
}: {
  inset: PageInset;
  rowCount: number;
  hasActions?: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <div
      style={rowStyle({
        background: TASK_TOKENS.backgroundSecondary,
        borderBottom: `1px solid ${TASK_TOKENS.border}`,
        borderTop: `1px solid ${TASK_TOKENS.border}`,
        gap: 10,
        marginTop: -1,
        minHeight: BACKLOG_SECTION_HEIGHT,
        padding: `0 ${inset.right}px 0 ${Math.max(inset.left - 8, 2) + 4}px`,
      })}
    >
      <TaskSkeletonBar width={12} height={12} />
      <TaskSkeletonBar width={88} height={13} />
      <TaskSkeletonBar width={96} height={10} />
      <span style={{ flex: 1 }} />
      {hasActions && (
        <>
          <TaskSkeletonBar width={96} height={4} radius="2px" />
          <Button width={84} />
          <Button width={24} />
        </>
      )}
    </div>
    {Array.from({ length: rowCount }, (_, row) => (
      <div
        key={row}
        style={rowStyle({
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          gap: 6,
          minHeight: BACKLOG_ROW_HEIGHT,
          padding: `0 ${inset.right}px 0 ${Math.max(inset.left - 14, 2) + 18}px`,
        })}
      >
        {/* Priority, status, key, title; epic, points and owner at the end. */}
        <span
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            width: 24,
          }}
        >
          <TaskSkeletonBar width={12} height={12} />
        </span>
        <span
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            width: 24,
          }}
        >
          <Circle size={14} />
        </span>
        <TaskSkeletonBar width={36} height={10} style={{ marginLeft: 6 }} />
        <TaskSkeletonBar
          width={`${[26, 18, 32, 22][row % 4]}%`}
          height={12}
          style={{ marginLeft: 20 }}
        />
        <span style={{ flex: 1 }} />
        {row % 2 === 0 && (
          <TaskSkeletonBar
            width={92}
            height={20}
            radius={TASK_TOKENS.radiusExtraSmall}
          />
        )}
        <span style={{ width: 64 }} />
        <Circle size={22} />
      </div>
    ))}
    <div
      style={rowStyle({
        borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
        gap: 8,
        minHeight: BACKLOG_ADD_ROW_HEIGHT,
        padding: `0 ${inset.right}px 0 ${inset.left + 22}px`,
      })}
    >
      <TaskSkeletonBar width={12} height={12} />
      <TaskSkeletonBar width={64} height={10} />
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
      padding: `12px ${inset.right}px 12px ${inset.left}px`,
      width: isFullScreen ? '100%' : 280,
    }}
  >
    <TaskSkeletonBar width={56} height={12} />
    <TaskSkeletonBar height={BUTTON_HEIGHT} radius={TASK_TOKENS.radiusSmall} />
    {[70, 55, 62].map((width) => (
      <div key={width} style={rowStyle({ gap: 8, minHeight: 30 })}>
        <TaskSkeletonBar width={8} height={8} radius="2px" />
        <TaskSkeletonBar width={`${width}%`} height={12} />
      </div>
    ))}
  </div>
);

// The properties column: section headings over 30px label/value rows, the
// label column 92px with its 8px inset, as the loaded panel draws them.
const SidebarSectionSkeleton = ({
  labelWidth,
  valueWidths,
}: {
  labelWidth: number;
  valueWidths: number[];
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 18 }}>
    <div style={rowStyle({ minHeight: 22, padding: '0 8px 4px 8px' })}>
      <TaskSkeletonBar width={labelWidth} height={9} />
    </div>
    {valueWidths.map((valueWidth, index) => (
      <div key={index} style={rowStyle({ minHeight: 30 })}>
        <span style={{ boxSizing: 'border-box', paddingLeft: 8, width: 92 }}>
          <TaskSkeletonBar
            width={[48, 36, 52, 44, 58][index % 5]}
            height={10}
          />
        </span>
        <span
          style={rowStyle({ flex: 1, gap: 6, minWidth: 0, padding: '0 6px' })}
        >
          <TaskSkeletonBar
            width={14}
            height={14}
            radius={index % 2 === 0 ? '50%' : TASK_TOKENS.radiusExtraSmall}
          />
          <TaskSkeletonBar width={`${valueWidth}%`} height={12} />
        </span>
      </div>
    ))}
  </div>
);

const SidebarSkeleton = () => (
  <>
    <SidebarSectionSkeleton
      labelWidth={64}
      valueWidths={[34, 26, 24, 44, 40, 18, 38]}
    />
    <SidebarSectionSkeleton labelWidth={56} valueWidths={[40, 32, 36, 28]} />
    <SidebarSectionSkeleton labelWidth={64} valueWidths={[42, 50]} />
  </>
);

// The issue column: title (the modal only, the record page's header already
// names the issue), a few lines of description, the sub-issue list,
// the activity tabs, the composer and a comment, at the loaded spacing.
const MainColumnSkeleton = ({
  isPage,
  isMobile,
}: {
  isPage: boolean;
  isMobile: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    {isPage && (
      <div style={rowStyle({ gap: 6, minHeight: 36 })}>
        <TaskSkeletonBar
          width={18}
          height={18}
          radius={TASK_TOKENS.radiusExtraSmall}
        />
        <TaskSkeletonBar width={88} height={12} />
        <TaskSkeletonBar width={14} height={14} />
        <TaskSkeletonBar width={40} height={12} />
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!isPage && (
        <TaskSkeletonBar width={isMobile ? '70%' : '42%'} height={24} />
      )}
      {[88, 76, 52].map((width) => (
        <TaskSkeletonBar key={width} width={`${width}%`} height={12} />
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={rowStyle({ gap: 10, minHeight: 24 })}>
        <TaskSkeletonBar width={72} height={12} />
        <TaskSkeletonBar width={24} height={10} />
        <TaskSkeletonBar width={72} height={4} radius="2px" />
      </div>
      <div
        style={{
          border: `1px solid ${TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radius,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {[46, 34].map((width) => (
          <div
            key={width}
            style={rowStyle({
              borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
              gap: 10,
              minHeight: 34,
              padding: '0 12px',
            })}
          >
            <Circle size={14} />
            <TaskSkeletonBar width={36} height={10} />
            <TaskSkeletonBar width={`${width}%`} height={12} />
          </div>
        ))}
        <div style={rowStyle({ gap: 10, minHeight: 34, padding: '0 10px' })}>
          <TaskSkeletonBar width={12} height={12} />
          <TaskSkeletonBar width={84} height={10} />
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={rowStyle({
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          gap: 16,
          minHeight: 34,
        })}
      >
        {[78, 70, 52, 54].map((width, index) => (
          <TaskSkeletonBar key={index} width={width} height={12} />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={rowStyle({ alignItems: 'flex-start', gap: 10 })}>
          <span style={{ paddingTop: 12 }}>
            <Circle size={20} />
          </span>
          <TaskSkeletonBar
            height={44}
            radius={TASK_TOKENS.radius}
            background={TASK_TOKENS.background}
            style={{
              border: `1px solid ${TASK_TOKENS.border}`,
              boxSizing: 'border-box',
              flex: 1,
            }}
          />
        </div>
        {[[60, 82], [40]].map((lines, index) => (
          <div
            key={index}
            style={rowStyle({ alignItems: 'flex-start', gap: 10 })}
          >
            <span style={{ paddingTop: 11 }}>
              <Circle size={20} />
            </span>
            <div
              style={{
                border: `1px solid ${TASK_TOKENS.border}`,
                borderRadius: TASK_TOKENS.radius,
                boxSizing: 'border-box',
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                gap: 10,
                minWidth: 0,
                padding: '14px 12px',
              }}
            >
              <div style={rowStyle({ gap: 8 })}>
                <TaskSkeletonBar width={72} height={11} />
                <TaskSkeletonBar width={56} height={9} />
              </div>
              {lines.map((width) => (
                <TaskSkeletonBar key={width} width={`${width}%`} height={11} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// What the issue detail looks like while its route is in flight, in either
// frame: the modal (its 48px header, the issue column, the properties column
// at the modal's width) or the record page (no header, the breadcrumb at the
// top of the issue column, the page's side column). The modal shell itself
// (backdrop, dialog) is TaskBoardDetailFrame's.
export const TaskBoardDetailSkeleton = ({
  isMobile,
  presentation = 'modal',
}: {
  isMobile: boolean;
  presentation?: 'modal' | 'page';
}) => {
  const isPage = presentation === 'page';
  const sideColumnWidth = readStoredSideColumnWidth();

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {!isPage && (
        <div
          style={rowStyle({
            borderBottom: `1px solid ${TASK_TOKENS.border}`,
            gap: 4,
            minHeight: DETAIL_HEADER_HEIGHT,
            padding: isMobile ? '0 8px 0 12px' : '0 12px 0 20px',
          })}
        >
          <div style={rowStyle({ flex: 1, gap: 6, minWidth: 0 })}>
            <TaskSkeletonBar
              width={18}
              height={18}
              radius={TASK_TOKENS.radiusExtraSmall}
            />
            {!isMobile && <TaskSkeletonBar width={88} height={12} />}
            <TaskSkeletonBar width={14} height={14} />
            <TaskSkeletonBar width={40} height={12} />
          </div>
          {!isMobile && (
            <TaskSkeletonBar
              width={32}
              height={10}
              style={{ margin: '0 6px' }}
            />
          )}
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TaskSkeletonBar
              key={index}
              width={24}
              height={24}
              radius={TASK_TOKENS.radiusSmall}
              style={{ marginLeft: index === 2 ? 9 : 0 }}
            />
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: isPage && !isMobile ? 'wrap' : 'nowrap',
          minHeight: 0,
        }}
      >
        <div
          style={{
            boxSizing: 'border-box',
            flex: isPage ? `1 1 ${PAGE_ISSUE_COLUMN_MIN_WIDTH}px` : 1,
            minWidth: 0,
            overflow: 'hidden',
            padding: isMobile
              ? '16px 16px 24px 16px'
              : isPage
                ? DETAIL_PAGE_MAIN_PADDING
                : DETAIL_MAIN_PADDING,
          }}
        >
          <MainColumnSkeleton isPage={isPage} isMobile={isMobile} />
        </div>
        {!isMobile && (
          <div
            style={{
              background: TASK_TOKENS.backgroundSecondary,
              borderLeft: `1px solid ${TASK_TOKENS.border}`,
              boxSizing: 'border-box',
              flex: isPage
                ? `0 0 ${readPageSideColumnWidth(sideColumnWidth)}`
                : '0 0 auto',
              overflow: 'hidden',
              padding: DETAIL_SIDE_PADDING,
              width: isPage
                ? undefined
                : readModalSideColumnWidth(sideColumnWidth),
            }}
          >
            <SidebarSkeleton />
          </div>
        )}
      </div>
    </div>
  );
};
