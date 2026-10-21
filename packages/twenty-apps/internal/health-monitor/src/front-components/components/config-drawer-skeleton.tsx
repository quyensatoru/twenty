import { t } from 'twenty-sdk/front-component';

import { HEALTH_TOKENS, spacing } from './health-tokens';
import { SkeletonBar, SkeletonCard, SkeletonPulse } from './skeleton';

const FieldSkeleton = ({ labelWidth = 80 }: { labelWidth?: number }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(1.5),
      flex: '1 1 220px',
    }}
  >
    <SkeletonBar width={labelWidth} height={9} />
    <SkeletonBar width="100%" height={32} radius={HEALTH_TOKENS.radius} />
  </div>
);

export const ConfigDrawerSkeleton = () => (
  <SkeletonPulse label={t('Loading settings…')}>
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: spacing(3.5) }}
    >
      <SkeletonCard>
        <FieldSkeleton labelWidth={64} />
        <div style={{ display: 'flex', gap: spacing(3) }}>
          <FieldSkeleton labelWidth={52} />
          <FieldSkeleton labelWidth={96} />
        </div>
        <div style={{ display: 'flex', gap: spacing(4) }}>
          <SkeletonBar width={220} height={32} radius={HEALTH_TOKENS.radius} />
          <SkeletonBar width={150} height={32} radius={HEALTH_TOKENS.radius} />
          <SkeletonBar width={120} height={32} radius={HEALTH_TOKENS.radius} />
        </div>
      </SkeletonCard>
      <SkeletonCard>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            style={{ display: 'flex', alignItems: 'center', gap: spacing(2.5) }}
          >
            <SkeletonBar width={28} height={28} radius="50%" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing(1.5),
                flex: 1,
              }}
            >
              <SkeletonBar width={120} height={10} />
              <SkeletonBar width={170} height={8} />
            </div>
            <SkeletonBar
              width={180}
              height={28}
              radius={HEALTH_TOKENS.radius}
            />
          </div>
        ))}
      </SkeletonCard>
      <SkeletonCard>
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            style={{ display: 'flex', alignItems: 'center', gap: spacing(3) }}
          >
            <SkeletonBar width={110} height={10} />
            <SkeletonBar
              width="100%"
              height={32}
              radius={HEALTH_TOKENS.radius}
              style={{ flex: 1 }}
            />
            <SkeletonBar width={72} height={32} radius={HEALTH_TOKENS.radius} />
            <SkeletonBar width={72} height={32} radius={HEALTH_TOKENS.radius} />
            <SkeletonBar width={32} height={18} radius={HEALTH_TOKENS.radius} />
          </div>
        ))}
      </SkeletonCard>
    </div>
  </SkeletonPulse>
);
