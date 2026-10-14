import { INBOX_TOKENS } from './inbox-tokens';

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
