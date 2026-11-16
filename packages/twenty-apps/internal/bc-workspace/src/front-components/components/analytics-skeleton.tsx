import { BC_TOKENS, spacing } from './bc-theme';

const Block = ({ height }: { height: number }) => (
  <span
    style={{
      background: BC_TOKENS.backgroundTertiary,
      borderRadius: BC_TOKENS.radius,
      display: 'block',
      height,
      opacity: 0.7,
    }}
  />
);

export const AnalyticsSkeleton = () => (
  <div
    aria-busy="true"
    style={{ display: 'flex', flexDirection: 'column', gap: spacing(4) }}
  >
    <span style={{ display: 'block', width: 180 }}>
      <Block height={16} />
    </span>
    <div
      style={{
        display: 'grid',
        gap: spacing(3),
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      }}
    >
      {Array.from({ length: 8 }, (_, index) => (
        <Block key={index} height={92} />
      ))}
    </div>
    <Block height={220} />
  </div>
);
