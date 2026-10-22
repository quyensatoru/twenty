import { useState } from 'react';

import { MomentsButton } from './moments-button';
import { MomentsField } from './moments-field';
import { MomentsModal } from './moments-modal';
import { MomentsTextField } from './moments-text-field';
import { MOMENTS_TOKENS } from './moments-tokens';

export type PollFormInput = {
  question: string;
  options: { label: string; emoji: string }[];
};

type PollFormModalProps = {
  onClose: () => void;
  onSubmit: (input: PollFormInput) => Promise<void>;
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

export const PollFormModal = ({ onClose, onSubmit }: PollFormModalProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<{ label: string; emoji: string }[]>([
    { label: '', emoji: '' },
    { label: '', emoji: '' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOption = (index: number, field: 'label' | 'emoji', value: string) => {
    setOptions(options.map((option, i) => (i === index ? { ...option, [field]: value } : option)));
  };

  const submit = async () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((option) => ({ ...option, label: option.label.trim() })).filter((option) => option.label.length > 0);

    if (trimmedQuestion.length === 0) {
      setError('Nhập câu hỏi.');

      return;
    }

    if (trimmedOptions.length < MIN_OPTIONS) {
      setError(`Cần ít nhất ${MIN_OPTIONS} lựa chọn.`);

      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({ question: trimmedQuestion, options: trimmedOptions });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
      setIsSaving(false);
    }
  };

  return (
    <MomentsModal
      title="Tạo poll"
      onClose={onClose}
      footer={
        <>
          <MomentsButton variant="secondary" onClick={onClose}>Huỷ</MomentsButton>
          <MomentsButton variant="primary" isDisabled={isSaving} onClick={() => void submit()}>
            Tạo & gửi lên Mattermost
          </MomentsButton>
        </>
      }
    >
      {error === null ? null : <span style={{ color: MOMENTS_TOKENS.danger, fontSize: 12 }}>{error}</span>}
      <MomentsField label="Câu hỏi">
        <MomentsTextField ariaLabel="Câu hỏi" value={question} onChange={setQuestion} placeholder="Tiệc cuối năm: ăn ở đâu thì vui?" />
      </MomentsField>
      <MomentsField label="Lựa chọn" hint="Emoji là tuỳ chọn, hiện trước tên lựa chọn.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((option, index) => (
            <div key={index} style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 52 }}>
                <MomentsTextField ariaLabel={`Emoji lựa chọn ${index + 1}`} value={option.emoji} onChange={(value) => updateOption(index, 'emoji', value)} placeholder="🍖" />
              </div>
              <div style={{ flex: 1 }}>
                <MomentsTextField ariaLabel={`Lựa chọn ${index + 1}`} value={option.label} onChange={(value) => updateOption(index, 'label', value)} placeholder={`Lựa chọn ${index + 1}`} />
              </div>
              {options.length <= MIN_OPTIONS ? null : (
                <MomentsButton variant="ghost" size="small" ariaLabel="Xoá lựa chọn" onClick={() => setOptions(options.filter((_, i) => i !== index))}>
                  ✕
                </MomentsButton>
              )}
            </div>
          ))}
          {options.length >= MAX_OPTIONS ? null : (
            <MomentsButton variant="secondary" size="small" onClick={() => setOptions([...options, { label: '', emoji: '' }])}>
              + Thêm lựa chọn
            </MomentsButton>
          )}
        </div>
      </MomentsField>
    </MomentsModal>
  );
};
