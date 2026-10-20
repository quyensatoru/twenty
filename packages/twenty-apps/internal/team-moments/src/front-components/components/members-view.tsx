import { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'twenty-sdk/front-component';

import { type MemberGender, type MemberProfileRow, type MemberSummary } from '../../types/moments-records';
import { daysBetween, formatIsoDate, nextYearlyDate, parseIsoDate } from '../../utils/moments-date.util';
import { createRecord, readErrorText, updateRecord } from '../utils/moments-rest.util';
import { MemberAvatar } from './member-avatar';
import { MomentsButton } from './moments-button';
import { MomentsField } from './moments-field';
import { MomentsModal } from './moments-modal';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';

type MembersViewProps = {
  members: MemberSummary[];
  profiles: MemberProfileRow[];
  todayIso: string;
  currentMemberId: string | null;
  canEditProfiles: boolean;
  onSaved: () => Promise<void>;
};

type MemberRow = {
  member: MemberSummary;
  profile: MemberProfileRow | null;
  tenureMonths: number | null;
  nextLabel: string;
  nextDays: number;
};

type SortKey = 'next' | 'tenure' | 'name';

const GENDER_LABELS: Record<MemberGender, string> = {
  FEMALE: 'Nữ',
  MALE: 'Nam',
  UNSPECIFIED: 'Không nêu',
};

const pad = (value: number): string => String(value).padStart(2, '0');

const formatTenure = (months: number | null): string => {
  if (months === null || months < 0) {
    return '';
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (years === 0) {
    return `${rest} tháng`;
  }

  return rest === 0 ? `${years} năm` : `${years} năm ${rest} tháng`;
};

const buildRow = (member: MemberSummary, profile: MemberProfileRow | null, todayIso: string): MemberRow => {
  const today = parseIsoDate(todayIso);
  const birthday = parseIsoDate(profile?.birthday);
  const joinedAt = parseIsoDate(profile?.joinedAt);
  const candidates: { label: string; days: number }[] = [];

  if (birthday !== null) {
    const days = daysBetween(todayIso, formatIsoDate(nextYearlyDate(birthday, todayIso)));

    candidates.push({ label: days === 0 ? 'Sinh nhật hôm nay' : `Sinh nhật · còn ${days} ngày`, days });
  }

  if (joinedAt !== null) {
    const next = nextYearlyDate(joinedAt, todayIso);
    const years = next.year - joinedAt.year;
    const days = daysBetween(todayIso, formatIsoDate(next));

    if (years >= 1) {
      candidates.push({ label: days === 0 ? `Tròn ${years} năm hôm nay` : `Kỷ niệm ${years} năm · còn ${days} ngày`, days });
    }
  }

  const [nearest] = candidates.sort((first, second) => first.days - second.days);
  const tenureMonths =
    joinedAt === null || today === null
      ? null
      : (today.year - joinedAt.year) * 12 + (today.month - joinedAt.month) - (today.day < joinedAt.day ? 1 : 0);

  return {
    member,
    profile,
    tenureMonths,
    nextLabel: nearest?.label ?? (profile === null ? 'Chưa khai' : ''),
    nextDays: nearest?.days ?? Number.MAX_SAFE_INTEGER,
  };
};

const cellStyle = { borderBottom: `1px solid ${MOMENTS_TOKENS.borderLight}`, color: MOMENTS_TOKENS.textPrimary, fontSize: 13, padding: '10px 14px' } as const;
const headerCellStyle = { borderBottom: `1px solid ${MOMENTS_TOKENS.border}`, color: MOMENTS_TOKENS.textSecondary, fontSize: 12, fontWeight: 500, padding: '9px 14px', textAlign: 'left' } as const;

export const MembersView = ({ members, profiles, todayIso, currentMemberId, canEditProfiles, onSaved }: MembersViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('next');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [form, setForm] = useState<{ birthday: string; joinedAt: string; hideBirthYear: boolean; gender: MemberGender }>({
    birthday: '',
    joinedAt: '',
    hideBirthYear: true,
    gender: 'UNSPECIFIED',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const profileByMember = new Map(profiles.map((profile) => [profile.memberId, profile]));
    const built = members
      .filter((member) => member.name.toLowerCase().includes(query.trim().toLowerCase()))
      .map((member) => buildRow(member, profileByMember.get(member.id) ?? null, todayIso));

    if (sortKey === 'name') {
      return built.sort((first, second) => first.member.name.localeCompare(second.member.name, 'vi'));
    }

    if (sortKey === 'tenure') {
      return built.sort((first, second) => (second.tenureMonths ?? -1) - (first.tenureMonths ?? -1));
    }

    return built.sort((first, second) => first.nextDays - second.nextDays);
  }, [members, profiles, todayIso, sortKey, query]);

  const missingCount = rows.filter((row) => row.profile?.birthday === null || row.profile === null).length;
  const birthdaysThisMonth = rows.filter((row) => row.profile?.birthday?.slice(5, 7) === todayIso.slice(5, 7)).length;

  const openEditor = (row: MemberRow) => {
    setEditing(row);
    setError(null);
    setForm({
      birthday: row.profile?.birthday ?? '',
      joinedAt: row.profile?.joinedAt ?? '',
      hideBirthYear: row.profile?.hideBirthYear ?? true,
      gender: row.profile?.gender ?? 'UNSPECIFIED',
    });
  };

  const save = async () => {
    if (editing === null) {
      return;
    }

    const birthday = form.birthday.trim();
    const joinedAt = form.joinedAt.trim();

    if ((birthday.length > 0 && parseIsoDate(birthday) === null) || (joinedAt.length > 0 && parseIsoDate(joinedAt) === null)) {
      setError('Ngày phải có dạng YYYY-MM-DD.');

      return;
    }

    setIsSaving(true);

    const body = {
      displayName: editing.member.name,
      memberId: editing.member.id,
      birthday: birthday.length > 0 ? birthday : null,
      joinedAt: joinedAt.length > 0 ? joinedAt : null,
      hideBirthYear: form.hideBirthYear,
      gender: form.gender,
    };

    try {
      if (editing.profile === null) {
        await createRecord('memberProfiles', body);
      } else {
        await updateRecord('memberProfiles', editing.profile.id, body);
      }

      await onSaved();
      setEditing(null);
      void enqueueSnackbar({ message: 'Đã lưu hồ sơ.', variant: 'success' });
    } catch (saveError) {
      setError(readErrorText(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const formatBirthday = (row: MemberRow): string => {
    const birthday = parseIsoDate(row.profile?.birthday);

    if (birthday === null) {
      return 'Chưa khai';
    }

    const isOwnRow = row.member.id === currentMemberId;

    return row.profile?.hideBirthYear === true && !isOwnRow
      ? `${pad(birthday.day)}/${pad(birthday.month)}`
      : `${pad(birthday.day)}/${pad(birthday.month)}/${birthday.year}`;
  };

  const formatJoinedAt = (row: MemberRow): string => {
    const joinedAt = parseIsoDate(row.profile?.joinedAt);

    return joinedAt === null ? 'Chưa khai' : `${pad(joinedAt.day)}/${pad(joinedAt.month)}/${joinedAt.year}`;
  };

  const femaleCount = profiles.filter((profile) => profile.gender === 'FEMALE').length;
  const missingGenderCount = members.length - profiles.filter((profile) => profile.gender === 'FEMALE' || profile.gender === 'MALE').length;

  const stats = [
    { label: 'Thành viên', value: String(members.length) },
    { label: 'Thành viên nữ', value: String(femaleCount) },
    { label: 'Chưa khai giới tính', value: String(missingGenderCount) },
    { label: 'Sinh nhật tháng này', value: String(birthdaysThisMonth) },
    { label: 'Chưa khai ngày sinh', value: String(missingCount) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: MOMENTS_TOKENS.fontFamily, gap: 16, padding: '20px 24px' }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ borderRadius: 8, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, padding: 14 }}>
            <div style={{ color: MOMENTS_TOKENS.textSecondary, fontSize: 13 }}>{stat.label}</div>
            <div style={{ color: MOMENTS_TOKENS.textPrimary, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ width: 260 }}>
          <MomentsTextField ariaLabel="Tìm thành viên" value={query} onChange={setQuery} placeholder="Tìm theo tên..." />
        </div>
        {(
          [
            { key: 'next', label: 'Mốc gần nhất' },
            { key: 'tenure', label: 'Thâm niên' },
            { key: 'name', label: 'Tên A-Z' },
          ] as const
        ).map((option) => {
          const isSelected = option.key === sortKey;

          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSortKey(option.key)}
              style={{
                background: isSelected ? MOMENTS_TOKENS.inverted : MOMENTS_TOKENS.background,
                border: `1px solid ${isSelected ? MOMENTS_TOKENS.inverted : MOMENTS_TOKENS.border}`,
                borderRadius: 14,
                color: isSelected ? MOMENTS_TOKENS.invertedText : MOMENTS_TOKENS.textSecondary,
                cursor: 'pointer',
                fontSize: 13,
                height: 28,
                padding: '0 10px',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div style={{ borderRadius: 8, boxShadow: `0 0 0 1px ${MOMENTS_TOKENS.border}`, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 760, width: '100%' }}>
          <thead>
            <tr style={{ background: MOMENTS_TOKENS.backgroundSecondary }}>
              <th style={headerCellStyle}>Thành viên</th>
              <th style={headerCellStyle}>Giới tính</th>
              <th style={headerCellStyle}>Ngày sinh</th>
              <th style={headerCellStyle}>Ngày vào làm</th>
              <th style={headerCellStyle}>Thâm niên</th>
              <th style={headerCellStyle}>Mốc tiếp theo</th>
              {canEditProfiles ? <th style={headerCellStyle} /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.member.id}>
                <td style={cellStyle}>
                  <div style={{ alignItems: 'center', display: 'flex', gap: 10 }}>
                    <MemberAvatar name={row.member.name} seed={row.member.id} size={30} />
                    <div>
                      <div style={{ fontWeight: 500 }}>{row.member.name}{row.member.id === currentMemberId ? ' (bạn)' : ''}</div>
                      <div style={{ color: MOMENTS_TOKENS.textTertiary, fontSize: 12 }}>{row.member.email ?? ''}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...cellStyle, color: row.profile?.gender === 'FEMALE' || row.profile?.gender === 'MALE' ? MOMENTS_TOKENS.textPrimary : MOMENTS_TOKENS.textTertiary }}>
                  {GENDER_LABELS[row.profile?.gender ?? 'UNSPECIFIED']}
                </td>
                <td style={{ ...cellStyle, color: row.profile?.birthday ? MOMENTS_TOKENS.textPrimary : MOMENTS_TOKENS.textTertiary }}>{formatBirthday(row)}</td>
                <td style={{ ...cellStyle, color: row.profile?.joinedAt ? MOMENTS_TOKENS.textPrimary : MOMENTS_TOKENS.textTertiary }}>{formatJoinedAt(row)}</td>
                <td style={cellStyle}>{formatTenure(row.tenureMonths)}</td>
                <td style={cellStyle}>{row.nextLabel}</td>
                {canEditProfiles ? (
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <MomentsButton variant="ghost" size="small" onClick={() => openEditor(row)}>Sửa</MomentsButton>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: MOMENTS_TOKENS.textTertiary, fontSize: 12 }}>
        Năm sinh chỉ hiện với chính chủ khi bật "Ẩn năm sinh".
      </div>

      {editing === null ? null : (
        <MomentsModal
          title={`Hồ sơ: ${editing.member.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <MomentsButton variant="secondary" onClick={() => setEditing(null)}>Huỷ</MomentsButton>
              <MomentsButton variant="primary" isDisabled={isSaving} onClick={() => void save()}>Lưu</MomentsButton>
            </>
          }
        >
          {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}
          <MomentsField label="Giới tính" hint="Dùng để chúc đúng người vào 20/10, 8/3 và các dịp tương tự.">
            <div role="radiogroup" aria-label="Giới tính" style={{ display: 'flex', gap: 12 }}>
              {(['FEMALE', 'MALE', 'UNSPECIFIED'] as const).map((gender) => (
                <label key={gender} style={{ alignItems: 'center', color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontSize: 13, gap: 6 }}>
                  <input type="radio" checked={form.gender === gender} onChange={() => setForm({ ...form, gender })} />
                  {GENDER_LABELS[gender]}
                </label>
              ))}
            </div>
          </MomentsField>
          <MomentsField label="Ngày sinh" hint="Dạng YYYY-MM-DD">
            <MomentsTextField type="date" ariaLabel="Ngày sinh" value={form.birthday} onChange={(birthday) => setForm({ ...form, birthday })} />
          </MomentsField>
          <MomentsField label="Ngày vào làm" hint="Ngày làm việc đầu tiên">
            <MomentsTextField type="date" ariaLabel="Ngày vào làm" value={form.joinedAt} onChange={(joinedAt) => setForm({ ...form, joinedAt })} />
          </MomentsField>
          <label style={{ alignItems: 'center', color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontSize: 13, gap: 8 }}>
            <input type="checkbox" checked={form.hideBirthYear} onChange={(event) => setForm({ ...form, hideBirthYear: event.target.checked })} />
            Ẩn năm sinh với người khác
          </label>
        </MomentsModal>
      )}
    </div>
  );
};
