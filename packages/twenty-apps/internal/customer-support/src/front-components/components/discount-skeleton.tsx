import { type CSSProperties } from 'react';

import { PULSE_TRANSITION, usePulse } from '../hooks/use-pulse';
import {
  ACTIONS_CELL_STYLE,
  CELL_STYLE,
  DiscountTableHeader,
  TABLE_STYLE,
} from './discount-table';
import { DISCOUNT_TOKENS, spacing } from './discount-theme';

type BoneProps = {
  width: number | string;
  height?: number;
  radius?: number | string;
  style?: CSSProperties;
};

const Bone = ({ width, height = 8, radius = 4, style }: BoneProps) => (
  <span
    style={{
      background: DISCOUNT_TOKENS.backgroundTertiary,
      borderRadius: radius,
      display: 'block',
      flexShrink: 0,
      height,
      width,
      ...style,
    }}
  />
);

// Widths follow what each column usually holds, varied per row so the
// skeleton reads like data rather than a grid of equal bars.
const ROW_SHAPES = [
  { code: 92, reason: 64, offer: 84, shop: 168, period: 92, creator: 72, hasReason: true },
  { code: 78, reason: 0, offer: 40, shop: 150, period: 70, creator: 64, hasReason: false },
  { code: 104, reason: 80, offer: 84, shop: 176, period: 92, creator: 80, hasReason: true },
  { code: 86, reason: 0, offer: 92, shop: 72, period: 92, creator: 60, hasReason: false },
  { code: 96, reason: 56, offer: 84, shop: 160, period: 70, creator: 76, hasReason: true },
];

const SkeletonRow = ({
  shape,
  hasActions,
}: {
  shape: (typeof ROW_SHAPES)[number];
  hasActions: boolean;
}) => (
  <tr>
    <td style={CELL_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Bone width={shape.code} height={9} />
        {shape.hasReason && <Bone width={shape.reason} height={7} />}
      </div>
    </td>
    <td style={CELL_STYLE}>
      <div style={{ alignItems: 'center', display: 'flex', gap: spacing(1.5) }}>
        <Bone width={8} height={8} radius={2} />
        <Bone width={36} height={9} />
      </div>
    </td>
    <td style={CELL_STYLE}>
      <Bone width={shape.offer} height={9} />
    </td>
    <td style={CELL_STYLE}>
      <Bone width={shape.shop} height={20} radius={DISCOUNT_TOKENS.radiusSmall} />
    </td>
    <td style={CELL_STYLE}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Bone width={shape.period} height={9} />
        <Bone width={48} height={7} />
      </div>
    </td>
    <td style={CELL_STYLE}>
      <Bone width={32} height={9} />
    </td>
    <td style={CELL_STYLE}>
      <Bone width={76} height={20} radius={DISCOUNT_TOKENS.radiusSmall} />
    </td>
    <td style={{ ...CELL_STYLE, borderRight: 'none' }}>
      <Bone width={shape.creator} height={9} />
    </td>
    {hasActions && (
      <td style={{ ...CELL_STYLE, ...ACTIONS_CELL_STYLE, background: DISCOUNT_TOKENS.background, borderRight: 'none' }}>
        <div style={{ display: 'flex', gap: spacing(2), justifyContent: 'flex-end' }}>
          {[0, 1, 2, 3].map((icon) => (
            <Bone key={icon} width={16} height={16} radius={DISCOUNT_TOKENS.radiusSmall} />
          ))}
        </div>
      </td>
    )}
  </tr>
);

const usePulseStyle = (): CSSProperties => {
  const isDim = usePulse();

  return { opacity: isDim ? 0.55 : 1, transition: PULSE_TRANSITION };
};

export const DiscountTableSkeleton = ({
  isMobile,
  hasActions,
}: {
  isMobile: boolean;
  hasActions: boolean;
}) => {
  const pulseStyle = usePulseStyle();

  if (isMobile) {
    return (
      <div aria-hidden="true" style={pulseStyle}>
        {ROW_SHAPES.map((shape, index) => (
          <div
            key={index}
            style={{
              borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(2),
              padding: `${spacing(3)} ${spacing(4)}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Bone width={shape.code} height={10} />
              <Bone width={76} height={20} radius={DISCOUNT_TOKENS.radiusSmall} />
            </div>
            <div style={{ display: 'flex', gap: spacing(2) }}>
              <Bone width={44} />
              <Bone width={shape.offer} />
              <Bone width={shape.shop / 2} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <table aria-hidden="true" style={TABLE_STYLE}>
      <DiscountTableHeader hasActions={hasActions} />
      <tbody style={pulseStyle}>
        {ROW_SHAPES.map((shape, index) => (
          <SkeletonRow key={index} shape={shape} hasActions={hasActions} />
        ))}
      </tbody>
    </table>
  );
};

// Same rail and two text lines as an entry of the delivery history.
export const SyncTimelineSkeleton = () => {
  const pulseStyle = usePulseStyle();

  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', ...pulseStyle }}>
      {[180, 140].map((width, index) => (
        <div key={index} style={{ display: 'flex', gap: spacing(3), paddingBottom: spacing(4) }}>
          <Bone width={8} height={8} radius="50%" style={{ marginTop: 5 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Bone width={width} height={9} />
            <Bone width={width + 60} height={7} />
          </div>
        </div>
      ))}
    </div>
  );
};

// One block per app, laid out like a connection row: header, two labelled
// inputs and the footer line.
export const ConnectionsSkeleton = () => {
  const pulseStyle = usePulseStyle();

  return (
    <div aria-hidden="true" style={pulseStyle}>
      {[0, 1].map((index) => (
        <div
          key={index}
          style={{
            borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(3),
            padding: spacing(4),
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: spacing(2) }}>
            <Bone width={8} height={8} radius={2} />
            <Bone width={60} height={9} />
            <span style={{ flex: 1 }} />
            <Bone width={90} height={20} radius={DISCOUNT_TOKENS.radiusSmall} />
          </div>
          {[0, 1].map((field) => (
            <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
              <Bone width={70} height={8} />
              <Bone width="100%" height={32} radius={DISCOUNT_TOKENS.radiusSmall} />
            </div>
          ))}
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <Bone width={140} height={7} />
            <Bone width={52} height={24} radius={DISCOUNT_TOKENS.radiusSmall} />
          </div>
        </div>
      ))}
    </div>
  );
};
