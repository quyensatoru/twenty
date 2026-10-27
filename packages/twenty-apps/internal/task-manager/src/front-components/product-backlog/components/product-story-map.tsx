import { t } from 'twenty-sdk/front-component';

import { BACKLOG_SECTION_KEY } from '../../../types/backlog';
import {
  type ProductBacklogData,
  type ProductItem,
} from '../../../types/product-backlog';
import { type PageInset } from '../../../types/task-board';
import { readEpicColor } from '../../../utils/epic-color.util';
import { IssueTypeGlyph } from '../../components/task-board-card';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { type ProductBacklogModel } from '../hooks/use-product-backlog-model';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductReadinessDot,
} from './product-ui';

type ProductStoryMapProps = {
  data: ProductBacklogData;
  model: ProductBacklogModel;
  items: readonly ProductItem[];
  inset: PageInset;
  onOpenItem: (issueId: string) => void;
};

const COLUMN_WIDTH = 220;
const LANE_WIDTH = 140;

// Epics across, planned sprints and the backlog down: where each epic's
// stories sit in the plan, and which epics have nothing planned yet.
export const ProductStoryMap = ({
  data,
  model,
  items,
  inset,
  onOpenItem,
}: ProductStoryMapProps) => {
  const lanes = [
    ...model.futureSprints.map((sprint) => ({
      key: sprint.id,
      name: sprint.name ?? t('Sprint'),
    })),
    { key: BACKLOG_SECTION_KEY, name: t('Backlog') },
  ];
  const laneOf = (item: ProductItem) => item.sprintId ?? BACKLOG_SECTION_KEY;
  const itemsWithoutEpic = items.filter(
    (item) => typeof item.epicId !== 'string',
  );

  const renderCard = (item: ProductItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => onOpenItem(item.id)}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxShadow: TASK_TOKENS.shadowLight,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '6px 8px',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <IssueTypeGlyph issueType={item.issueType ?? null} />
        <span style={PRODUCT_MUTED_STYLE}>{item.issueKey}</span>
        <span style={{ flex: 1 }} />
        <ProductReadinessDot percent={model.readinessOf(item).percent} />
        <span style={PRODUCT_MUTED_STYLE}>{item.storyPoints ?? '–'}</span>
      </span>
      <span
        style={{
          ...PRODUCT_TEXT_STYLE,
          display: '-webkit-box',
          fontSize: 12,
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {item.title ?? t('(No title)')}
      </span>
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        gap: 16,
        minHeight: 0,
        overflow: 'auto',
        padding: `8px ${inset.right}px 24px ${inset.left}px`,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      {data.epics.length === 0 ? (
        <span style={PRODUCT_MUTED_STYLE}>
          {t('Create epics to group items into a story map.')}
        </span>
      ) : (
        <div
          style={{
            alignContent: 'start',
            display: 'grid',
            gap: 8,
            gridTemplateColumns: `${LANE_WIDTH}px repeat(${data.epics.length}, ${COLUMN_WIDTH}px)`,
          }}
        >
          <span />
          {data.epics.map((epic) => (
            <div
              key={epic.id}
              style={{
                ...PRODUCT_TEXT_STYLE,
                alignItems: 'center',
                borderTop: `3px solid ${readTagColor(readEpicColor(epic)).text}`,
                display: 'flex',
                fontWeight: 600,
                gap: 6,
                padding: '6px 2px',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {epic.name ?? t('Untitled epic')}
              </span>
              <span style={PRODUCT_MUTED_STYLE}>
                {items.filter((item) => item.epicId === epic.id).length}
              </span>
            </div>
          ))}
          {lanes.map((lane) => (
            <div key={lane.key} style={{ display: 'contents' }}>
              <div
                style={{
                  ...PRODUCT_MUTED_STYLE,
                  fontWeight: 600,
                  paddingTop: 6,
                }}
              >
                {lane.name}
              </div>
              {data.epics.map((epic) => (
                <div
                  key={epic.id}
                  style={{
                    background: TASK_TOKENS.backgroundSecondary,
                    borderRadius: TASK_TOKENS.radiusSmall,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minHeight: 48,
                    padding: 6,
                  }}
                >
                  {items
                    .filter(
                      (item) =>
                        item.epicId === epic.id && laneOf(item) === lane.key,
                    )
                    .map(renderCard)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <aside
        style={{
          display: 'flex',
          flex: `0 0 ${COLUMN_WIDTH}px`,
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            ...PRODUCT_MUTED_STYLE,
            fontWeight: 600,
            padding: '6px 2px',
          }}
        >
          {t('No epic ({count})', { count: itemsWithoutEpic.length })}
        </div>
        {itemsWithoutEpic.map(renderCard)}
      </aside>
    </div>
  );
};
