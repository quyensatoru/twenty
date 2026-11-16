import { t } from 'twenty-sdk/front-component';
import { Avatar } from 'twenty-ui/primitives/data-display';

import { type BcContextMember } from '../../types/bc-context';
import { BC_TOKENS, spacing } from './bc-theme';
import { BcSelect } from './bc-select';

export const UNASSIGNED_VALUE = 'UNASSIGNED';

export const ClientPicLabel = ({ name }: { name: string | null }) =>
  name === null ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>{t('Unassigned')}</span>
  ) : (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(1.5), minWidth: 0 }}>
      <Avatar name={name} size="sm" shape="circle" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
    </span>
  );

export const buildPicOptions = (members: BcContextMember[], includeUnassigned: boolean) => [
  ...(includeUnassigned ? [{ value: UNASSIGNED_VALUE, label: t('Unassigned') }] : []),
  ...members.map((member) => ({
    value: member.workspaceMemberId,
    label: member.name,
    description: member.teamName ?? undefined,
    startElement: <Avatar name={member.name} size="sm" shape="circle" />,
  })),
];

// Inline reassignment in the table and the panel; managers and admins only.
export const ClientPicSelect = ({
  picId,
  picName,
  members,
  onChange,
  width = 180,
}: {
  picId: string | null;
  picName: string | null;
  members: BcContextMember[];
  onChange: (picId: string | null) => void;
  width?: number | string;
}) => {
  const options = buildPicOptions(members, true);
  const hasCurrent = picId === null || options.some((option) => option.value === picId);

  return (
    <BcSelect
      ariaLabel={t('PIC')}
      value={picId ?? UNASSIGNED_VALUE}
      options={
        hasCurrent || picId === null
          ? options
          : [...options, { value: picId, label: picName ?? picId }]
      }
      onChange={(value) => onChange(value === UNASSIGNED_VALUE ? null : value)}
      width={width}
      menuWidth={260}
    />
  );
};
