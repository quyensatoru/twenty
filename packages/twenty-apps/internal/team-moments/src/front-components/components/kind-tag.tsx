import { type OccurrenceKind } from '../../types/occurrence';
import { KIND_STYLES } from './kind-styles';
import { MOMENTS_TOKENS } from './moments-tokens';

export const KindTag = ({ kind }: { kind: OccurrenceKind }) => (
  <span
    style={{
      background: KIND_STYLES[kind].soft,
      borderRadius: 10,
      color: KIND_STYLES[kind].text,
      fontFamily: MOMENTS_TOKENS.fontFamily,
      fontSize: 12,
      fontWeight: 500,
      padding: '2px 8px',
      whiteSpace: 'nowrap',
    }}
  >
    {KIND_STYLES[kind].label}
  </span>
);
