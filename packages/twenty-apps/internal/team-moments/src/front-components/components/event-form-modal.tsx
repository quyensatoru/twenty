import { useState } from 'react';

import { type TeamEventRow } from '../../types/moments-records';
import { parseIsoDate } from '../../utils/moments-date.util';
import { MomentsButton } from './moments-button';
import { MomentsField } from './moments-field';
import { MomentsModal } from './moments-modal';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';

export type TeamEventInput = Omit<TeamEventRow, 'id' | 'organizerId'>;

type EventFormModalProps = {
  todayIso: string;
  onClose: () => void;
  onSubmit: (input: TeamEventInput) => Promise<void>;
};

export const EventFormModal = ({ todayIso, onClose, onSubmit }: EventFormModalProps) => {
  const [form, setForm] = useState<TeamEventInput>({
    name: '',
    kind: 'CUSTOM',
    date: todayIso,
    isYearly: false,
    startTime: '',
    location: '',
    description: '',
    audience: 'EVERYONE',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (form.name.trim().length === 0) {
      setError('Nhập tên sự kiện.');

      return;
    }

    if (parseIsoDate(form.date) === null) {
      setError('Ngày phải có dạng YYYY-MM-DD.');

      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({ ...form, name: form.name.trim() });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
      setIsSaving(false);
    }
  };

  return (
    <MomentsModal
      title="Thêm sự kiện"
      onClose={onClose}
      footer={
        <>
          <MomentsButton variant="secondary" onClick={onClose}>Huỷ</MomentsButton>
          <MomentsButton variant="primary" isDisabled={isSaving} onClick={() => void submit()}>Tạo sự kiện</MomentsButton>
        </>
      }
    >
      {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}
      <MomentsField label="Tên sự kiện">
        <MomentsTextField ariaLabel="Tên sự kiện" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Year End Party, Team building..." />
      </MomentsField>
      <div role="radiogroup" aria-label="Loại sự kiện" style={{ display: 'flex', gap: 8 }}>
        {(
          [
            { value: 'CUSTOM', label: 'Sự kiện riêng' },
            { value: 'HOLIDAY', label: 'Ngày lễ' },
          ] as const
        ).map((option) => (
          <label key={option.value} style={{ alignItems: 'center', color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, gap: 6 }}>
            <input type="radio" checked={form.kind === option.value} onChange={() => setForm({ ...form, kind: option.value })} />
            {option.label}
          </label>
        ))}
      </div>
      <MomentsField label="Dành cho" hint="Chọn Các chị em cho 20/10, 8/3: app tự lấy danh sách theo giới tính trong hồ sơ.">
        <div role="radiogroup" aria-label="Dành cho" style={{ display: 'flex', gap: 12 }}>
          {(
            [
              { value: 'EVERYONE', label: 'Mọi người' },
              { value: 'WOMEN', label: 'Các chị em' },
              { value: 'MEN', label: 'Các anh em' },
            ] as const
          ).map((option) => (
            <label key={option.value} style={{ alignItems: 'center', color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, gap: 6 }}>
              <input type="radio" checked={form.audience === option.value} onChange={() => setForm({ ...form, audience: option.value })} />
              {option.label}
            </label>
          ))}
        </div>
      </MomentsField>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <MomentsField label="Ngày">
          <MomentsTextField type="date" ariaLabel="Ngày" value={form.date} onChange={(date) => setForm({ ...form, date })} />
        </MomentsField>
        <MomentsField label="Giờ bắt đầu">
          <MomentsTextField type="time" ariaLabel="Giờ bắt đầu" value={form.startTime ?? ''} onChange={(startTime) => setForm({ ...form, startTime })} />
        </MomentsField>
      </div>
      <MomentsField label="Địa điểm">
        <MomentsTextField ariaLabel="Địa điểm" value={form.location ?? ''} onChange={(location) => setForm({ ...form, location })} />
      </MomentsField>
      <MomentsField label="Mô tả">
        <MomentsTextField ariaLabel="Mô tả" isMultiline rows={2} value={form.description ?? ''} onChange={(description) => setForm({ ...form, description })} />
      </MomentsField>
      <label style={{ alignItems: 'center', color: MOMENTS_TOKENS.textPrimary, display: 'flex', fontFamily: MOMENTS_TOKENS.fontFamily, fontSize: 13, gap: 8 }}>
        <input type="checkbox" checked={form.isYearly} onChange={(event) => setForm({ ...form, isYearly: event.target.checked })} />
        Lặp lại hằng năm
      </label>
    </MomentsModal>
  );
};
