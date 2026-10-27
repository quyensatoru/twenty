import { t } from 'twenty-sdk/front-component';

import { type SprintVelocity } from '../../../types/product-backlog';
import { type SprintBurndownRow } from '../../../utils/product-backlog/backlog-metrics.util';
import { readTagColor, TASK_TOKENS } from '../../components/task-tokens';
import { PRODUCT_MUTED_STYLE } from './product-ui';

const COMMITTED_COLOR = readTagColor('blue').text;
const COMPLETED_COLOR = readTagColor('orange').text;
const SCOPE_COLOR = readTagColor('orange').text;
const IDEAL_COLOR = TASK_TOKENS.textLight;

const ChartLegend = ({
  entries,
}: {
  entries: { label: string; color: string; isDashed?: boolean }[];
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    {entries.map((entry) => (
      <span
        key={entry.label}
        style={{
          ...PRODUCT_MUTED_STYLE,
          alignItems: 'center',
          display: 'inline-flex',
          gap: 6,
        }}
      >
        <span
          style={{
            borderTop: `2px ${entry.isDashed === true ? 'dashed' : 'solid'} ${entry.color}`,
            display: 'inline-block',
            width: 14,
          }}
        />
        {entry.label}
      </span>
    ))}
  </div>
);

const readNiceMax = (value: number) => {
  if (value <= 5) {
    return 5;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));

  return Math.ceil(value / magnitude) * magnitude;
};

const YAxis = ({ max, height }: { max: number; height: number }) => (
  <div
    style={{
      ...PRODUCT_MUTED_STYLE,
      display: 'flex',
      flexDirection: 'column',
      fontSize: 11,
      height,
      justifyContent: 'space-between',
      textAlign: 'right',
      width: 28,
    }}
  >
    <span>{max}</span>
    <span>{Math.round(max / 2)}</span>
    <span>0</span>
  </div>
);

type VelocityChartProps = {
  velocity: readonly SprintVelocity[];
  height?: number;
};

// Committed against completed points per sprint, the running one last.
export const VelocityChart = ({
  velocity,
  height = 180,
}: VelocityChartProps) => {
  if (velocity.length === 0) {
    return (
      <span style={PRODUCT_MUTED_STYLE}>
        {t('Velocity shows up once a sprint has run.')}
      </span>
    );
  }

  const max = readNiceMax(
    Math.max(
      1,
      ...velocity.flatMap((sprint) => [
        sprint.committedPoints,
        sprint.completedPoints,
      ]),
    ),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <YAxis max={max} height={height} />
        <div
          style={{
            alignItems: 'flex-end',
            borderBottom: `1px solid ${TASK_TOKENS.borderStrong}`,
            display: 'flex',
            flex: 1,
            gap: 12,
            height,
            justifyContent: 'space-around',
            minWidth: 0,
          }}
        >
          {velocity.map((sprint) => (
            <div
              key={sprint.sprintId}
              title={`${sprint.name}: ${sprint.completedPoints} / ${sprint.committedPoints} pt`}
              style={{
                alignItems: 'flex-end',
                display: 'flex',
                gap: 2,
                height: '100%',
                opacity: sprint.isActive ? 0.6 : 1,
              }}
            >
              {[
                { value: sprint.committedPoints, color: COMMITTED_COLOR },
                { value: sprint.completedPoints, color: COMPLETED_COLOR },
              ].map((bar, index) => (
                <span
                  key={index}
                  style={{
                    background: bar.color,
                    borderRadius: '3px 3px 0 0',
                    display: 'block',
                    height: `${(bar.value / max) * 100}%`,
                    minHeight: bar.value > 0 ? 2 : 0,
                    width: 14,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-around',
          paddingLeft: 34,
        }}
      >
        {velocity.map((sprint) => (
          <span
            key={sprint.sprintId}
            style={{
              ...PRODUCT_MUTED_STYLE,
              fontSize: 11,
              overflow: 'hidden',
              textAlign: 'center',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: 64,
            }}
          >
            {sprint.name}
          </span>
        ))}
      </div>
      <ChartLegend
        entries={[
          { label: t('Committed'), color: COMMITTED_COLOR },
          { label: t('Completed'), color: COMPLETED_COLOR },
        ]}
      />
    </div>
  );
};

type BurndownChartProps = {
  rows: readonly SprintBurndownRow[];
  height?: number;
};

const VIEW_WIDTH = 1000;

// Ideal against remaining points per day; scope steps up when work is added
// after the start.
export const BurndownChart = ({ rows, height = 180 }: BurndownChartProps) => {
  if (rows.length < 2) {
    return (
      <span style={PRODUCT_MUTED_STYLE}>
        {t('Give the sprint a start and an end date to see its burndown.')}
      </span>
    );
  }

  const max = readNiceMax(
    Math.max(
      1,
      ...rows.flatMap((row) => [row.ideal, row.remaining ?? 0, row.scope ?? 0]),
    ),
  );
  const x = (index: number) => (index / (rows.length - 1)) * VIEW_WIDTH;
  const y = (value: number) => height - (value / max) * height;
  const buildPoints = (read: (row: SprintBurndownRow) => number | null) =>
    rows
      .map((row, index) => ({ value: read(row), index }))
      .filter(
        (point): point is { value: number; index: number } =>
          point.value !== null,
      )
      .map((point) => `${x(point.index)},${y(point.value)}`)
      .join(' ');
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <YAxis max={max} height={height} />
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
          preserveAspectRatio="none"
          style={{
            borderBottom: `1px solid ${TASK_TOKENS.borderStrong}`,
            flex: 1,
            height,
            minWidth: 0,
            overflow: 'visible',
          }}
        >
          <polyline
            points={buildPoints((row) => row.ideal)}
            fill="none"
            stroke={IDEAL_COLOR}
            strokeDasharray="8 8"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={buildPoints((row) => row.scope)}
            fill="none"
            stroke={SCOPE_COLOR}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={buildPoints((row) => row.remaining)}
            fill="none"
            stroke={COMMITTED_COLOR}
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: 34,
        }}
      >
        {rows
          .filter(
            (_row, index) =>
              index % labelEvery === 0 || index === rows.length - 1,
          )
          .map((row) => (
            <span
              key={row.date}
              style={{ ...PRODUCT_MUTED_STYLE, fontSize: 11 }}
            >
              {row.date.slice(5)}
            </span>
          ))}
      </div>
      <ChartLegend
        entries={[
          { label: t('Ideal'), color: IDEAL_COLOR, isDashed: true },
          { label: t('Remaining'), color: COMMITTED_COLOR },
          { label: t('Scope'), color: SCOPE_COLOR },
        ]}
      />
    </div>
  );
};
