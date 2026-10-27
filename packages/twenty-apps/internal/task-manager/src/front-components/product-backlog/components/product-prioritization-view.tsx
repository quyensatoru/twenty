import { useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconArrowsSort, IconBook, IconInfoCircle } from 'twenty-ui/icon';

import {
  type MoscowBucket,
  type ProductItem,
  type ScoreInputs,
} from '../../../types/product-backlog';
import { readMoscowVotes } from '../../../utils/product-backlog/categorical-templates.util';
import {
  formatTemplateScore,
  rankItemsByTemplate,
} from '../../../utils/product-backlog/prioritization-templates.util';
import { computeCompetitorAdoptionFactor } from '../../../utils/product-backlog/sae-ice-caf-template.util';
import { IssueTypeGlyph } from '../../components/task-board-card';
import { TaskBoardSelect } from '../../components/task-board-select';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { TaskPriorityGlyph } from '../../components/task-priority-glyph';
import { TaskTabs } from '../../components/task-tabs';
import {
  readTagColor,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { type ProductViewProps } from '../types/product-view-props';
import { ProductPairwiseDialog } from './product-pairwise-dialog';
import { MoscowVotePicker, ScoreFieldInput } from './product-score-editor';
import {
  ProductTemplateVisual,
  readTemplateVisualTitle,
} from './product-template-visuals';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCard,
  ProductCommitTextInput,
} from './product-ui';

type PrioritizationScope = 'backlog' | 'planned';

type ProductPrioritizationViewProps = ProductViewProps & {
  matchesFilters: (item: ProductItem) => boolean;
  onOpenSettings: () => void;
};

const ALL_COLUMNS = 'ALL';
const CELL_PADDING = '6px 8px';

// Score the backlog with the project's template, see the result the way that
// template thinks about it, then apply the order to the backlog in one go.
export const ProductPrioritizationView = ({
  data,
  model,
  actions,
  inset,
  isMobile,
  onOpenItem,
  matchesFilters,
  onOpenSettings,
}: ProductPrioritizationViewProps) => {
  const [scope, setScope] = useState<PrioritizationScope>('backlog');
  const [focusedColumn, setFocusedColumn] = useState(ALL_COLUMNS);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPairwiseOpen, setIsPairwiseOpen] = useState(false);
  const { template } = model;
  const settings = data.settings;
  const isReadOnly = !data.canWrite;

  const scopeItems = useMemo(
    () =>
      (scope === 'backlog'
        ? model.backlogItems
        : data.items.filter((item) => item.stage === 'ITEM')
      ).filter(matchesFilters),
    [scope, model.backlogItems, data.items, matchesFilters],
  );
  const rows = useMemo(
    () => rankItemsByTemplate(scopeItems, template, settings),
    [scopeItems, template, settings],
  );
  const scoredCount = rows.filter((row) => row.score !== null).length;
  const movedCount = rows.filter(
    (row, index) => scopeItems[index]?.id !== row.item.id,
  ).length;
  const fields =
    template.id === 'wsjf' && focusedColumn !== ALL_COLUMNS
      ? template.fields.filter((field) => field.key === focusedColumn)
      : template.fields;

  const setInputs = (item: ProductItem, inputs: ScoreInputs) =>
    void actions.updateItem(item.id, {
      priorityScores: { ...(item.priorityScores ?? {}), [template.id]: inputs },
    });

  const columns = [
    '40px',
    'minmax(260px, 2fr)',
    ...(template.special === 'votes'
      ? settings.stakeholders.map(() => '110px')
      : []),
    ...fields.map(
      (field) =>
        `${(field.width ?? (field.kind === 'select' ? 110 : 80)) + 16}px`,
    ),
    ...(template.special === 'competitors' ? ['64px'] : []),
    '80px',
    '150px',
    'minmax(180px, 1fr)',
  ].join(' ');

  const headerCell = (label: string, hint?: string) => (
    <div
      key={label}
      title={hint}
      style={{
        ...PRODUCT_MUTED_STYLE,
        background: TASK_TOKENS.backgroundSecondary,
        borderBottom: `1px solid ${TASK_TOKENS.border}`,
        fontWeight: 600,
        padding: CELL_PADDING,
        position: 'sticky',
        top: 0,
        whiteSpace: 'nowrap',
        zIndex: 1,
      }}
    >
      {label}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
        overflowY: 'auto',
        padding: `12px ${inset.right}px 24px ${inset.left}px`,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={PRODUCT_MUTED_STYLE}>{t('Template in use')}</span>
        <span
          style={{
            ...PRODUCT_TEXT_STYLE,
            background: TASK_TOKENS.accentSoft,
            borderRadius: TASK_TOKENS.radiusSmall,
            color: TASK_TOKENS.accent,
            fontWeight: 600,
            padding: '2px 8px',
          }}
        >
          {template.name}
        </span>
        <TaskButton size="small" variant="ghost" onClick={onOpenSettings}>
          {t('Change template in Settings')}
        </TaskButton>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'minmax(0, 1fr) minmax(0, 1.4fr)',
        }}
      >
        <ProductCard title={template.name}>
          <span style={PRODUCT_TEXT_STYLE}>{t(template.description)}</span>
          <code
            style={{
              ...PRODUCT_TEXT_STYLE,
              background: TASK_TOKENS.backgroundTertiary,
              borderRadius: TASK_TOKENS.radiusSmall,
              fontSize: 12,
              padding: '6px 8px',
            }}
          >
            {t(template.formula)}
          </code>
          <span
            style={{
              ...PRODUCT_MUTED_STYLE,
              alignItems: 'center',
              display: 'flex',
              gap: 4,
            }}
          >
            <IconBook size={13} />
            {t(template.source)}
          </span>
          {template.id === 'wsjf' && (
            <span style={PRODUCT_MUTED_STYLE}>
              {t(
                'Do: weigh uncertainty, score one column at a time, estimate Job Size as a team, revisit the ranking after delivery. Don’t: use real counts as Job Size, think of Job Size as time, refuse to split a feature.',
              )}
            </span>
          )}
        </ProductCard>
        <ProductCard
          title={readTemplateVisualTitle(template)}
          trailing={
            <span style={PRODUCT_MUTED_STYLE}>
              {t('{scored} of {total} scored', {
                scored: scoredCount,
                total: rows.length,
              })}
            </span>
          }
        >
          <ProductTemplateVisual
            rows={rows}
            template={template}
            settings={settings}
            onOpenItem={onOpenItem}
            onStartPairwise={
              data.canWrite ? () => setIsPairwiseOpen(true) : null
            }
          />
        </ProductCard>
      </div>

      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <TaskTabs
          value={scope}
          onChange={setScope}
          tabs={[
            {
              value: 'backlog',
              label: t('Backlog ({count})', {
                count: model.backlogItems.length,
              }),
            },
            { value: 'planned', label: t('Including planned sprints') },
          ]}
        />
        {template.id === 'wsjf' && (
          <TaskBoardSelect
            ariaLabel={t('Columns')}
            width={200}
            value={focusedColumn}
            options={[
              { value: ALL_COLUMNS, label: t('Show every column') },
              ...template.fields.map((field) => ({
                value: field.key,
                label: t('Score only: {column}', { column: t(field.label) }),
              })),
            ]}
            onChange={setFocusedColumn}
          />
        )}
        <span style={{ flex: 1 }} />
        <span
          style={{
            ...PRODUCT_MUTED_STYLE,
            alignItems: 'center',
            display: 'flex',
            gap: 4,
          }}
        >
          <IconInfoCircle size={13} />
          {t(
            'Sorted by score. The backlog order changes only when you apply it.',
          )}
        </span>
        {data.canWrite && (
          <TaskButton
            variant="primary"
            size="compact"
            isDisabled={scope !== 'backlog' || movedCount === 0}
            onClick={() => setIsConfirming(true)}
          >
            <IconArrowsSort size={14} />
            {t('Apply order to backlog')}
          </TaskButton>
        )}
      </div>

      <div
        style={{
          border: `1px solid ${TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radius,
          overflowX: 'auto',
          ...TASK_THIN_SCROLLBAR_STYLE,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columns,
            minWidth: 'max-content',
          }}
        >
          {headerCell('#')}
          {headerCell(t('Item'))}
          {template.special === 'votes' &&
            settings.stakeholders.map((stakeholder) =>
              headerCell(t(stakeholder.name)),
            )}
          {fields.map((field) =>
            headerCell(
              t(field.label),
              field.hint === undefined ? undefined : t(field.hint),
            ),
          )}
          {template.special === 'competitors' &&
            headerCell('CAF', t('Competitor Adoption Factor'))}
          {headerCell(t('Score'))}
          {headerCell(t('Class'))}
          {headerCell(t('Score reasoning'))}
          {rows.map((row, index) => {
            const item = row.item;
            const inputs = item.priorityScores?.[template.id] ?? {};
            const cellStyle = {
              alignItems: 'center',
              borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
              display: 'flex',
              minWidth: 0,
              padding: CELL_PADDING,
            };

            return (
              <div key={item.id} style={{ display: 'contents' }}>
                <div style={{ ...cellStyle, ...PRODUCT_MUTED_STYLE }}>
                  {row.score === null ? '–' : index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenItem(item.id)}
                  style={{
                    ...cellStyle,
                    ...PRODUCT_TEXT_STYLE,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                    cursor: 'pointer',
                    gap: 6,
                    textAlign: 'left',
                  }}
                >
                  <TaskPriorityGlyph priority={item.priority} />
                  <IssueTypeGlyph issueType={item.issueType ?? null} />
                  <span style={{ ...PRODUCT_MUTED_STYLE, flexShrink: 0 }}>
                    {item.issueKey}
                  </span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </span>
                </button>
                {template.special === 'votes' &&
                  settings.stakeholders.map((stakeholder) => {
                    const votes = readMoscowVotes(inputs);

                    return (
                      <div key={stakeholder.id} style={cellStyle}>
                        <MoscowVotePicker
                          value={votes[stakeholder.id] ?? null}
                          isReadOnly={isReadOnly}
                          onChange={(bucket) => {
                            const next: Record<string, MoscowBucket> = {
                              ...votes,
                            };

                            if (bucket === null) {
                              delete next[stakeholder.id];
                            } else {
                              next[stakeholder.id] = bucket;
                            }

                            setInputs(item, { ...inputs, votes: next });
                          }}
                        />
                      </div>
                    );
                  })}
                {fields.map((field) => (
                  <div key={field.key} style={cellStyle}>
                    <ScoreFieldInput
                      field={field}
                      value={inputs[field.key]}
                      isReadOnly={isReadOnly}
                      onChange={(value) => {
                        const next = { ...inputs, [field.key]: value };

                        if (value === undefined) {
                          delete next[field.key];
                        }

                        setInputs(item, next);
                      }}
                    />
                  </div>
                ))}
                {template.special === 'competitors' && (
                  <button
                    type="button"
                    title={t('Set competitor adoption in the item')}
                    onClick={() => onOpenItem(item.id)}
                    style={{
                      ...cellStyle,
                      ...PRODUCT_MUTED_STYLE,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                      color: TASK_TOKENS.accent,
                      cursor: 'pointer',
                    }}
                  >
                    {computeCompetitorAdoptionFactor(inputs, settings).toFixed(
                      2,
                    )}
                  </button>
                )}
                <div
                  style={{
                    ...cellStyle,
                    ...PRODUCT_TEXT_STYLE,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                  }}
                >
                  {row.score === null ? (
                    <span style={PRODUCT_MUTED_STYLE}>—</span>
                  ) : (
                    formatTemplateScore(template, row.score) || '✓'
                  )}
                </div>
                <div style={cellStyle}>
                  {row.classification !== null && (
                    <span
                      style={{
                        background: readTagColor(row.classification.color)
                          .background,
                        borderRadius: TASK_TOKENS.radiusExtraSmall,
                        color: readTagColor(row.classification.color).text,
                        fontFamily: TASK_TOKENS.fontFamily,
                        fontSize: 12,
                        overflow: 'hidden',
                        padding: '1px 6px',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t(row.classification.label)}
                    </span>
                  )}
                </div>
                <div style={cellStyle}>
                  <ProductCommitTextInput
                    ariaLabel={t('Score reasoning')}
                    value={item.scoreReasoning ?? ''}
                    placeholder={t('Why?')}
                    isDisabled={isReadOnly}
                    onCommit={(scoreReasoning) =>
                      void actions.updateItem(item.id, { scoreReasoning })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isConfirming && (
        <twenty-overlay>
          <TaskDialogFrame
            title={t('Apply {template} order', { template: template.name })}
            onClose={() => setIsConfirming(false)}
            footer={
              <>
                <TaskButton
                  variant="ghost"
                  onClick={() => setIsConfirming(false)}
                >
                  {t('Cancel')}
                </TaskButton>
                <TaskButton
                  variant="primary"
                  onClick={() => {
                    setIsConfirming(false);
                    void actions.reorderItems(rows.map((row) => row.item.id));
                  }}
                >
                  {t('Apply')}
                </TaskButton>
              </>
            }
          >
            <span style={PRODUCT_TEXT_STYLE}>
              {t(
                '{moved} items change place in the backlog. Unscored items ({unscored}) go to the bottom in their current order.',
                { moved: movedCount, unscored: rows.length - scoredCount },
              )}
            </span>
            <ol style={{ ...PRODUCT_TEXT_STYLE, margin: 0, paddingLeft: 18 }}>
              {rows.slice(0, 8).map((row) => (
                <li key={row.item.id}>
                  {row.item.issueKey} · {row.item.title}
                </li>
              ))}
            </ol>
          </TaskDialogFrame>
        </twenty-overlay>
      )}

      {isPairwiseOpen && (
        <twenty-overlay>
          <ProductPairwiseDialog
            items={scopeItems}
            onClose={() => setIsPairwiseOpen(false)}
            onSave={(rankedItems) => {
              setIsPairwiseOpen(false);
              rankedItems.forEach((item, index) =>
                setInputs(item, { rank: index + 1 }),
              );
            }}
          />
        </twenty-overlay>
      )}
    </div>
  );
};
