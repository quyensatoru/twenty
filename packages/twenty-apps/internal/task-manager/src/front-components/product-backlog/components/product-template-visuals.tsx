import { t } from 'twenty-sdk/front-component';

import {
  type MoscowBucket,
  type ProductBacklogSettings,
} from '../../../types/product-backlog';
import { sumStoryPoints } from '../../../utils/product-backlog/backlog-metrics.util';
import {
  analyzeMoscowVotes,
  KANO_CATEGORIES,
  type KanoCategory,
  MOSCOW_BUCKETS,
} from '../../../utils/product-backlog/categorical-templates.util';
import { type PrioritizationTemplate } from '../../../utils/product-backlog/prioritization-template.util';
import { type ScoredProductItem } from '../../../utils/product-backlog/prioritization-templates.util';
import { PHASE_MEANING } from '../../../utils/product-backlog/sae-ice-caf-template.util';
import { TaskButton } from '../../components/task-button';
import { readTagColor, TASK_TOKENS } from '../../components/task-tokens';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductBarList,
  ProductWarning,
} from './product-ui';

type VisualProps = {
  rows: readonly ScoredProductItem[];
  template: PrioritizationTemplate;
  settings: ProductBacklogSettings;
  onOpenItem: (issueId: string) => void;
  // Null for a read-only caller: comparing writes the ranking.
  onStartPairwise: (() => void) | null;
};

const BucketCard = ({
  title,
  count,
  color,
  lines,
}: {
  title: string;
  count: number;
  color: string;
  lines: string[];
}) => (
  <div
    style={{
      border: `1px solid ${TASK_TOKENS.border}`,
      borderRadius: TASK_TOKENS.radiusSmall,
      borderTop: `3px solid ${color}`,
      display: 'flex',
      flex: '1 1 140px',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      padding: 10,
    }}
  >
    <div style={{ ...PRODUCT_TEXT_STYLE, display: 'flex', fontWeight: 600 }}>
      <span style={{ flex: 1 }}>{title}</span>
      <span>{count}</span>
    </div>
    {lines.map((line) => (
      <span key={line} style={PRODUCT_MUTED_STYLE}>
        {line}
      </span>
    ))}
  </div>
);

const PhaseVisual = ({ rows, settings }: VisualProps) => {
  const { phaseOne, phaseTwo, phaseThree } = settings.phaseThresholds;
  const ranges: Record<number, string> = {
    1: `> ${phaseOne}`,
    2: `${phaseTwo}–${phaseOne}`,
    3: `${phaseThree}–<${phaseTwo}`,
    4: `< ${phaseThree}`,
  };
  const colors = ['green', 'blue', 'yellow', 'gray'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {[1, 2, 3, 4].map((order) => {
        const items = rows
          .filter((row) => row.classification?.order === order)
          .map((row) => row.item);

        return (
          <BucketCard
            key={order}
            title={t('Phase {order}', { order })}
            count={items.length}
            color={readTagColor(colors[order - 1]).text}
            lines={[
              t('Score {range}', { range: ranges[order] }),
              t(PHASE_MEANING[order]),
              `${sumStoryPoints(items)} pt`,
            ]}
          />
        );
      })}
    </div>
  );
};

const MATRIX_WIDTH = 360;
const MATRIX_HEIGHT = 260;
const MATRIX_PADDING = 28;

const MatrixVisual = ({ rows, template, onOpenItem }: VisualProps) => {
  const isRiskValue = template.id === 'risk-value';
  const xKey = isRiskValue ? 'value' : 'effort';
  const yKey = isRiskValue ? 'risk' : 'value';
  const scaleX = (value: number) =>
    MATRIX_PADDING + ((value - 0.5) / 10) * (MATRIX_WIDTH - MATRIX_PADDING * 2);
  const scaleY = (value: number) =>
    MATRIX_HEIGHT -
    MATRIX_PADDING -
    ((value - 0.5) / 10) * (MATRIX_HEIGHT - MATRIX_PADDING * 2);
  const middleX = scaleX(5.5);
  const middleY = scaleY(5.5);
  const quadrants = isRiskValue
    ? [
        {
          isRight: true,
          isBottom: false,
          label: '1 · High risk / High value',
          color: 'green',
        },
        {
          isRight: true,
          isBottom: true,
          label: '2 · Low risk / High value',
          color: 'turquoise',
        },
        {
          isRight: false,
          isBottom: true,
          label: '3 · Low risk / Low value',
          color: 'yellow',
        },
        {
          isRight: false,
          isBottom: false,
          label: '? · High risk / Low value',
          color: 'red',
        },
      ]
    : [
        {
          isRight: false,
          isBottom: false,
          label: 'Quick wins',
          color: 'green',
        },
        { isRight: true, isBottom: false, label: 'Big bets', color: 'blue' },
        { isRight: false, isBottom: true, label: 'Fill-ins', color: 'yellow' },
        { isRight: true, isBottom: true, label: 'Time sinks', color: 'red' },
      ];
  const points = rows
    .filter((row) => row.score !== null)
    .map((row) => {
      const inputs = row.item.priorityScores?.[template.id] ?? {};

      return { row, x: Number(inputs[xKey]), y: Number(inputs[yKey]) };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  return (
    <svg
      viewBox={`0 0 ${MATRIX_WIDTH} ${MATRIX_HEIGHT}`}
      style={{ maxWidth: MATRIX_WIDTH * 1.4, width: '100%' }}
    >
      {quadrants.map((quadrant) => {
        const left = quadrant.isRight ? middleX : MATRIX_PADDING;
        const top = quadrant.isBottom ? middleY : MATRIX_PADDING;
        const color = readTagColor(quadrant.color).text;

        return (
          <g key={quadrant.label}>
            <rect
              x={left}
              y={top}
              width={
                quadrant.isRight
                  ? MATRIX_WIDTH - MATRIX_PADDING - middleX
                  : middleX - MATRIX_PADDING
              }
              height={
                quadrant.isBottom
                  ? MATRIX_HEIGHT - MATRIX_PADDING - middleY
                  : middleY - MATRIX_PADDING
              }
              fill={color}
              opacity={0.08}
            />
            <text x={left + 6} y={top + 14} fill={color} fontSize={10.5}>
              {t(quadrant.label)}
            </text>
          </g>
        );
      })}
      <line
        x1={middleX}
        y1={MATRIX_PADDING}
        x2={middleX}
        y2={MATRIX_HEIGHT - MATRIX_PADDING}
        stroke={TASK_TOKENS.borderStrong}
      />
      <line
        x1={MATRIX_PADDING}
        y1={middleY}
        x2={MATRIX_WIDTH - MATRIX_PADDING}
        y2={middleY}
        stroke={TASK_TOKENS.borderStrong}
      />
      <text
        x={MATRIX_WIDTH / 2}
        y={MATRIX_HEIGHT - 6}
        fill={TASK_TOKENS.textTertiary}
        fontSize={11}
        textAnchor="middle"
      >
        {isRiskValue ? t('Value →') : t('Effort →')}
      </text>
      <text
        x={10}
        y={MATRIX_HEIGHT / 2}
        fill={TASK_TOKENS.textTertiary}
        fontSize={11}
        textAnchor="middle"
        transform={`rotate(-90 10 ${MATRIX_HEIGHT / 2})`}
      >
        {isRiskValue ? t('Risk →') : t('Value →')}
      </text>
      {points.map((point, index) => (
        <circle
          key={point.row.item.id}
          cx={scaleX(point.x) + ((index % 3) - 1) * 4}
          cy={scaleY(point.y) + ((index % 2) - 0.5) * 4}
          r={5}
          fill={readTagColor(point.row.classification?.color ?? 'gray').text}
          stroke={TASK_TOKENS.background}
          style={{ cursor: 'pointer' }}
          onClick={() => onOpenItem(point.row.item.id)}
        >
          <title>{`${point.row.item.issueKey ?? ''} · ${point.row.item.title ?? ''}`}</title>
        </circle>
      ))}
    </svg>
  );
};

const VotesVisual = ({ rows, settings }: VisualProps) => {
  const analysis = analyzeMoscowVotes(
    rows.map((row) => ({
      id: row.item.id,
      inputs: row.item.priorityScores?.moscow,
    })),
    settings,
  );
  const keyById = new Map(
    rows.map((row) => [row.item.id, row.item.issueKey ?? '']),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(MOSCOW_BUCKETS) as MoscowBucket[]).map((bucket) => (
          <BucketCard
            key={bucket}
            title={t(MOSCOW_BUCKETS[bucket].label)}
            count={
              rows.filter(
                (row) =>
                  row.classification?.label === MOSCOW_BUCKETS[bucket].label,
              ).length
            }
            color={readTagColor(MOSCOW_BUCKETS[bucket].color).text}
            lines={[
              t('{points} points per vote', {
                points: settings.moscowPoints[bucket],
              }),
            ]}
          />
        ))}
      </div>
      <span style={PRODUCT_MUTED_STYLE}>{t('MVP = Must (+ Should).')}</span>
      {analysis.ties.map((tie) => (
        <ProductWarning key={tie.total}>
          {t('Tied at {total} points: {keys}. Discuss to break the tie.', {
            total: tie.total,
            keys: tie.ids.map((id) => keyById.get(id) ?? '').join(', '),
          })}
        </ProductWarning>
      ))}
      {analysis.flatVoterIds.map((voterId) => (
        <ProductWarning key={voterId}>
          {t(
            '{name} votes every item the same, which does not help rank them.',
            {
              name: t(
                settings.stakeholders.find(
                  (stakeholder) => stakeholder.id === voterId,
                )?.name ?? voterId,
              ),
            },
          )}
        </ProductWarning>
      ))}
    </div>
  );
};

const KanoVisual = ({ rows }: VisualProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    {(
      [
        'MUST',
        'PERFORMANCE',
        'ATTRACTIVE',
        'INDIFFERENT',
        'REVERSE',
      ] as KanoCategory[]
    ).map((category) => (
      <BucketCard
        key={category}
        title={t(KANO_CATEGORIES[category].label)}
        count={
          rows.filter(
            (row) =>
              row.classification?.label === KANO_CATEGORIES[category].label,
          ).length
        }
        color={readTagColor(KANO_CATEGORIES[category].color).text}
        lines={[t(KANO_CATEGORIES[category].description)]}
      />
    ))}
  </div>
);

const BarVisual = ({ rows, template }: VisualProps) => (
  <ProductBarList
    rows={rows
      .filter((row) => row.score !== null)
      .slice(0, 10)
      .map((row, index) => ({
        label: `${row.item.issueKey ?? ''} ${row.item.title ?? ''}`,
        value: Math.round((row.score ?? 0) * 100) / 100,
        color: index < 3 ? readTagColor('blue').text : readTagColor('sky').text,
        note: template.shortName,
      }))}
  />
);

const RankVisual = ({ rows, onStartPairwise }: VisualProps) => {
  const rankedCount = rows.filter((row) => row.score !== null).length;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <BucketCard
        title={t('To be prioritized')}
        count={rows.length - rankedCount}
        color={readTagColor('gray').text}
        lines={[]}
      />
      <div
        style={{
          alignItems: 'center',
          border: `1px dashed ${TASK_TOKENS.border}`,
          borderRadius: TASK_TOKENS.radiusSmall,
          display: 'flex',
          flex: '1 1 140px',
          justifyContent: 'center',
          padding: 10,
        }}
      >
        {onStartPairwise === null ? (
          <span style={PRODUCT_MUTED_STYLE}>{t('View only')}</span>
        ) : (
          <TaskButton size="small" variant="primary" onClick={onStartPairwise}>
            {t('Compare A vs B')}
          </TaskButton>
        )}
      </div>
      <BucketCard
        title={t('Prioritized')}
        count={rankedCount}
        color={readTagColor('green').text}
        lines={[]}
      />
    </div>
  );
};

export const readTemplateVisualTitle = (template: PrioritizationTemplate) => {
  switch (template.visual) {
    case 'phase':
      return t('By implementation phase');
    case 'matrix':
      return t('2×2 matrix');
    case 'votes':
      return t('MoSCoW result');
    case 'kano':
      return t('Kano categories');
    case 'rank':
      return t('20/20 board');
    case 'bar':
      return t('Top 10 by score');
  }
};

export const ProductTemplateVisual = (props: VisualProps) => {
  switch (props.template.visual) {
    case 'phase':
      return <PhaseVisual {...props} />;
    case 'matrix':
      return <MatrixVisual {...props} />;
    case 'votes':
      return <VotesVisual {...props} />;
    case 'kano':
      return <KanoVisual {...props} />;
    case 'rank':
      return <RankVisual {...props} />;
    case 'bar':
      return <BarVisual {...props} />;
  }
};
