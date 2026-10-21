import { t } from 'twenty-sdk/front-component';

import { HEALTH_TOKENS, spacing } from './health-tokens';
import { SkeletonBar, SkeletonCard, SkeletonPulse } from './skeleton';

const NODE_ROWS = 7;
const CELLS = 48;

const StatSkeleton = () => (
  <SkeletonCard withHeader={false}>
    <SkeletonBar width="55%" height={9} />
    <SkeletonBar width="45%" height={20} />
    <SkeletonBar width="65%" height={8} />
  </SkeletonCard>
);

const NodeCardSkeleton = () => (
  <SkeletonCard withHeader={false}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: spacing(2),
      }}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}
      >
        <SkeletonBar width={90} height={11} />
        <SkeletonBar width={150} height={8} />
      </div>
      <SkeletonBar width={58} height={20} />
    </div>
    {[0, 1, 2].map((row) => (
      <div
        key={row}
        style={{ display: 'flex', alignItems: 'center', gap: spacing(2.5) }}
      >
        <SkeletonBar width={28} height={8} />
        <SkeletonBar width="100%" height={20} style={{ flex: 1 }} />
        <SkeletonBar width={40} height={10} />
      </div>
    ))}
  </SkeletonCard>
);

export const DashboardSkeleton = () => (
  <SkeletonPulse label={t('Loading dashboard')}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(4) }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: spacing(3),
        }}
      >
        <div style={{ gridColumn: 'span 2', display: 'flex' }}>
          <SkeletonCard withHeader={false}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: spacing(4) }}
            >
              <SkeletonBar
                width={44}
                height={44}
                radius={HEALTH_TOKENS.radius}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing(2),
                  flex: 1,
                }}
              >
                <SkeletonBar width={90} height={9} />
                <SkeletonBar width={120} height={20} />
                <SkeletonBar width="70%" height={9} />
              </div>
            </div>
          </SkeletonCard>
        </div>
        {[0, 1, 2, 3].map((index) => (
          <StatSkeleton key={index} />
        ))}
      </div>

      <SkeletonCard>
        <div style={{ display: 'flex', gap: spacing(4) }}>
          {[56, 56, 56, 110].map((width, index) => (
            <SkeletonBar key={index} width={width} height={9} />
          ))}
        </div>
        {Array.from({ length: NODE_ROWS }, (_, row) => (
          <div
            key={row}
            style={{ display: 'flex', alignItems: 'center', gap: spacing(3) }}
          >
            <SkeletonBar width={80} height={10} style={{ marginRight: 30 }} />
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: `repeat(${CELLS}, minmax(0, 1fr))`,
                gap: 2,
              }}
            >
              {Array.from({ length: CELLS }, (_, cell) => (
                <SkeletonBar key={cell} width="100%" height={20} />
              ))}
            </div>
            <SkeletonBar width={48} height={9} />
          </div>
        ))}
      </SkeletonCard>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(4) }}>
        <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex' }}>
          <SkeletonCard>
            <SkeletonBar
              width="100%"
              height={180}
              radius={HEALTH_TOKENS.radius}
            />
          </SkeletonCard>
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex' }}>
          <SkeletonCard>
            <SkeletonBar
              width="100%"
              height={84}
              radius={HEALTH_TOKENS.radius}
            />
            <SkeletonBar
              width="100%"
              height={84}
              radius={HEALTH_TOKENS.radius}
            />
          </SkeletonCard>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: spacing(3),
        }}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <NodeCardSkeleton key={index} />
        ))}
      </div>
    </div>
  </SkeletonPulse>
);

export const HeaderTabsSkeleton = () => (
  <SkeletonPulse label={t('Loading apps')}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing(4),
        height: 44,
      }}
    >
      <SkeletonBar width={72} height={12} />
      <SkeletonBar width={60} height={12} />
      <SkeletonBar width={180} height={10} />
    </div>
  </SkeletonPulse>
);
