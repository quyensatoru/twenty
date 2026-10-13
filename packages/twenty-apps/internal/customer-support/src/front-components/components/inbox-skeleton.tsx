import { PULSE_TRANSITION, usePulse } from '../hooks/use-pulse';
import { INBOX_CIRCLE_STYLE, INBOX_TOKENS } from './inbox-tokens';

type InboxSkeletonBarProps = {
  width: number | string;
  height?: number;
};

export const InboxSkeletonBar = ({
  width,
  height = 10,
}: InboxSkeletonBarProps) => (
  <span
    style={{
      background: INBOX_TOKENS.backgroundTertiary,
      borderRadius: 999,
      display: 'block',
      height,
      width,
    }}
  />
);

export const InboxSkeletonRows = ({ count }: { count: number }) => {
  const isDim = usePulse();

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          style={{
            display: 'flex',
            gap: 12,
            opacity: (1 - index * 0.11) * (isDim ? 0.55 : 1),
            padding: '14px 12px',
            transition: PULSE_TRANSITION,
          }}
        >
          <span
            style={{
              ...INBOX_CIRCLE_STYLE,
              background: INBOX_TOKENS.backgroundTertiary,
              flexShrink: 0,
              height: 36,
              width: 36,
            }}
          />
          <span
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <InboxSkeletonBar width="55%" />
            <InboxSkeletonBar width="90%" height={8} />
            <InboxSkeletonBar width="35%" height={8} />
          </span>
        </div>
      ))}
    </>
  );
};
