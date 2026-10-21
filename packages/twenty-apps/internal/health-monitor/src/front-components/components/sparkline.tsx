import { buildSeriesPath } from '../utils/build-series-path.util';
import { HEALTH_TOKENS, LEVEL_STYLES } from './health-tokens';

type SparklineProps = {
  values: (number | null)[];
  maxValue: number;
  height: number;
  warningValue?: number | null;
  color?: string;
};

export const Sparkline = ({
  values,
  maxValue,
  height,
  warningValue = null,
  color = HEALTH_TOKENS.accent,
}: SparklineProps) => {
  const { line, area } = buildSeriesPath(values, maxValue);

  return (
    <div style={{ position: 'relative', height, flex: 1, minWidth: 0 }}>
      {warningValue !== null && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${100 - (Math.min(warningValue, maxValue) / maxValue) * 100}%`,
            borderTop: `1px solid ${LEVEL_STYLES.WARNING.fill}`,
            opacity: 0.6,
          }}
        />
      )}
      {line.length > 0 && (
        <svg
          viewBox={`0 0 ${Math.max(1, values.length - 1)} 100`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
          }}
        >
          <path d={area} fill={color} fillOpacity={0.08} stroke="none" />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
};
