import { MOMENTS_TOKENS } from './moments-tokens';

const AVATAR_PALETTE = [
  ['#FBD5A5', '#7A2E05'],
  ['#D7F0E2', '#1A5C38'],
  ['#C9E4F5', '#164B6B'],
  ['#E4DCFB', '#43277F'],
  ['#FDE2E2', '#8A1F1F'],
  ['#FFF1C2', '#6B4E00'],
  ['#DDF3F0', '#0B5249'],
] as const;

const hashText = (text: string): number =>
  [...text].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7);

export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

type MemberAvatarProps = {
  name: string;
  seed: string;
  size?: number;
};

export const MemberAvatar = ({ name, seed, size = 32 }: MemberAvatarProps) => {
  const [background, color] = AVATAR_PALETTE[hashText(seed) % AVATAR_PALETTE.length];

  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background,
        borderRadius: '50%',
        color,
        display: 'flex',
        flex: 'none',
        fontFamily: MOMENTS_TOKENS.fontFamily,
        fontSize: Math.round(size * 0.36),
        fontWeight: 600,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      {getInitials(name)}
    </span>
  );
};
