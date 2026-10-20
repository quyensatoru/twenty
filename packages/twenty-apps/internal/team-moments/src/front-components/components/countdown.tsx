import { useNow } from '../hooks/use-now';
import { MOMENTS_TOKENS } from './moments-tokens';

type CountdownProps = {
  targetMillis: number;
  tone?: 'light' | 'dark';
  size?: 'medium' | 'large';
};

const pad = (value: number): string => String(value).padStart(2, '0');

export const Countdown = ({ targetMillis, tone = 'light', size = 'medium' }: CountdownProps) => {
  const now = useNow();
  const remaining = Math.max(0, targetMillis - now);
  const units = [
    { value: Math.floor(remaining / 86_400_000), label: 'ngày' },
    { value: Math.floor(remaining / 3_600_000) % 24, label: 'giờ' },
    { value: Math.floor(remaining / 60_000) % 60, label: 'phút' },
    { value: Math.floor(remaining / 1000) % 60, label: 'giây' },
  ];
  const isDark = tone === 'dark';

  return (
    <div role="timer" aria-label="Đếm ngược" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
      {units.map((unit, index) => (
        <div
          key={unit.label}
          style={{
            background: isDark ? '#1F1F1F' : MOMENTS_TOKENS.backgroundTertiary,
            borderRadius: 8,
            padding: size === 'large' ? '12px 4px 10px' : '10px 4px 8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: isDark ? '#ffffff' : index === 3 ? '#C2410C' : MOMENTS_TOKENS.textPrimary,
              fontFamily: MOMENTS_TOKENS.fontFamily,
              fontSize: size === 'large' ? 30 : 24,
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {pad(unit.value)}
          </div>
          <div style={{ color: isDark ? '#BDBDBD' : MOMENTS_TOKENS.textSecondary, fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 11, marginTop: 4 }}>
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
};
