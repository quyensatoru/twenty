import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { type ProductItem } from '../../../types/product-backlog';
import { IssueTypeGlyph } from '../../components/task-board-card';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { TaskProgressBar } from '../../components/task-progress-bar';
import { TaskTextInput } from '../../components/task-text-input';
import { readTagColor, TASK_TOKENS } from '../../components/task-tokens';
import { PRODUCT_MUTED_STYLE, PRODUCT_TEXT_STYLE } from './product-ui';

type ProductPairwiseDialogProps = {
  items: readonly ProductItem[];
  onClose: () => void;
  // The items in their compared order, best first.
  onSave: (rankedItems: ProductItem[]) => void;
};

const DEFAULT_ITEM_COUNT = 10;

// 20/20 force-ranking, like an eye test: "A or B?" Insertion sort from the
// top of the ranked list, two items at a time.
export const ProductPairwiseDialog = ({
  items,
  onClose,
  onSave,
}: ProductPairwiseDialogProps) => {
  const [countText, setCountText] = useState(
    String(Math.min(DEFAULT_ITEM_COUNT, items.length)),
  );
  const [isStarted, setIsStarted] = useState(false);
  const [queue, setQueue] = useState<ProductItem[]>([]);
  const [ranked, setRanked] = useState<ProductItem[]>([]);
  const [compareIndex, setCompareIndex] = useState(0);
  const [comparisonCount, setComparisonCount] = useState(0);
  const count = Math.min(items.length, Math.max(2, Number(countText) || 2));
  const current = queue[0];
  const isDone = isStarted && current === undefined;

  const start = () => {
    const pool = items.slice(0, count);

    setRanked(pool.slice(0, 1));
    setQueue(pool.slice(1));
    setCompareIndex(0);
    setIsStarted(true);
  };

  const pick = (isNewItemHigher: boolean) => {
    setComparisonCount((value) => value + 1);

    if (isNewItemHigher) {
      setRanked([
        ...ranked.slice(0, compareIndex),
        current,
        ...ranked.slice(compareIndex),
      ]);
      setQueue(queue.slice(1));
      setCompareIndex(0);
    } else if (compareIndex + 1 >= ranked.length) {
      setRanked([...ranked, current]);
      setQueue(queue.slice(1));
      setCompareIndex(0);
    } else {
      setCompareIndex(compareIndex + 1);
    }
  };

  const renderCard = (
    item: ProductItem,
    label: string,
    isNewItemHigher: boolean,
  ) => (
    <button
      type="button"
      onClick={() => pick(isNewItemHigher)}
      style={{
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        cursor: 'pointer',
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 6,
        minHeight: 120,
        minWidth: 0,
        padding: 12,
        textAlign: 'left',
      }}
    >
      <span style={PRODUCT_MUTED_STYLE}>{label}</span>
      <span style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <IssueTypeGlyph issueType={item.issueType ?? null} />
        <span style={PRODUCT_MUTED_STYLE}>{item.issueKey}</span>
      </span>
      <span style={{ ...PRODUCT_TEXT_STYLE, fontWeight: 600 }}>
        {item.title}
      </span>
      {typeof item.userStory?.iWant === 'string' &&
        item.userStory.iWant !== '' && (
          <span style={PRODUCT_MUTED_STYLE}>
            {t('I want {goal}', { goal: item.userStory.iWant })}
          </span>
        )}
    </button>
  );

  return (
    <TaskDialogFrame
      title={t('20/20 · compare two at a time')}
      onClose={onClose}
      footer={
        isDone ? (
          <>
            <TaskButton variant="ghost" onClick={onClose}>
              {t('Cancel')}
            </TaskButton>
            <TaskButton variant="primary" onClick={() => onSave(ranked)}>
              {t('Save ranking')}
            </TaskButton>
          </>
        ) : (
          <TaskButton variant="ghost" onClick={onClose}>
            {t('Close')}
          </TaskButton>
        )
      }
    >
      {!isStarted && (
        <>
          <span style={PRODUCT_TEXT_STYLE}>
            {t(
              'Like an eye test: "A or B?" Always start from the top of the ranked list and compare two items at a time. A facilitator helps the team negotiate.',
            )}
          </span>
          <label style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
            <span style={PRODUCT_TEXT_STYLE}>
              {t('Items to rank, from the top of the backlog')}
            </span>
            <TaskTextInput
              ariaLabel={t('Items to rank')}
              type="number"
              value={countText}
              onChange={setCountText}
              width={80}
            />
          </label>
          <div>
            <TaskButton
              variant="primary"
              isDisabled={items.length < 2}
              onClick={start}
            >
              {t('Start')}
            </TaskButton>
          </div>
        </>
      )}
      {isStarted && current !== undefined && (
        <>
          <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
            <span style={PRODUCT_MUTED_STYLE}>
              {t('{ranked} of {total} ranked · {comparisons} comparisons', {
                ranked: ranked.length,
                total: count,
                comparisons: comparisonCount,
              })}
            </span>
            <span style={{ flex: 1 }} />
            <TaskProgressBar
              width={140}
              total={count}
              segments={[
                {
                  value: ranked.length,
                  color: readTagColor('blue').text,
                  label: t('Ranked'),
                },
              ]}
            />
          </div>
          <div style={{ alignItems: 'stretch', display: 'flex', gap: 10 }}>
            {renderCard(current, t('A · item being ranked'), true)}
            <span style={{ ...PRODUCT_MUTED_STYLE, alignSelf: 'center' }}>
              vs
            </span>
            {renderCard(
              ranked[compareIndex],
              t('B · currently #{rank}', { rank: compareIndex + 1 }),
              false,
            )}
          </div>
          <span style={{ ...PRODUCT_MUTED_STYLE, textAlign: 'center' }}>
            {t('Click the item with the higher priority')}
          </span>
        </>
      )}
      {isDone && (
        <ol style={{ ...PRODUCT_TEXT_STYLE, margin: 0, paddingLeft: 20 }}>
          {ranked.map((item) => (
            <li key={item.id} style={{ padding: '2px 0' }}>
              {item.issueKey} · {item.title}
            </li>
          ))}
        </ol>
      )}
    </TaskDialogFrame>
  );
};
