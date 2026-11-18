import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconLink } from 'twenty-ui/icon';

import {
  RELEASE_NOTIFICATION_CATEGORY_OPTIONS,
  type ReleaseNotificationCategory,
  type ReleaseNotificationStatus,
} from '../../../constants/release-notification';
import { type ReleaseNotificationInput } from '../../../types/release-notification';
import { TaskButton } from '../../components/task-button';
import {
  TaskDialogField,
  TaskDialogFrame,
} from '../../components/task-dialog-frame';
import { TaskRichTextEditor } from '../../components/task-rich-text-editor';
import { TaskTextInput } from '../../components/task-text-input';
import { TASK_TOKENS } from '../../components/task-tokens';
import {
  ReleaseCategoryIcon,
  readReleaseCategoryLabel,
  readReleaseCategoryTone,
} from './release-category-badge';

type ReleaseNotificationEditorDialogProps = {
  appName: string;
  initialInput: ReleaseNotificationInput;
  isNew: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSave: (input: ReleaseNotificationInput) => Promise<boolean>;
};

export const ReleaseNotificationEditorDialog = ({
  appName,
  initialInput,
  isNew,
  isMobile,
  onClose,
  onSave,
}: ReleaseNotificationEditorDialogProps) => {
  const [input, setInput] = useState<ReleaseNotificationInput>(initialInput);
  const [isSaving, setIsSaving] = useState(false);
  const isPublished = initialInput.status === 'PUBLISHED';
  const canSave = input.title.trim() !== '' && !isSaving;

  const update = (patch: Partial<ReleaseNotificationInput>) =>
    setInput((current) => ({ ...current, ...patch }));

  const save = async (status: ReleaseNotificationStatus) => {
    setIsSaving(true);
    const isSaved = await onSave({ ...input, status });
    setIsSaving(false);

    if (isSaved) {
      onClose();
    }
  };

  return (
    <TaskDialogFrame
      title={
        isNew
          ? t('New release in {app}', { app: appName })
          : t('Edit release in {app}', { app: appName })
      }
      width={760}
      onClose={onClose}
      footer={
        <>
          <TaskButton onClick={onClose}>{t('Cancel')}</TaskButton>
          {isPublished ? (
            <TaskButton
              variant="primary"
              isDisabled={!canSave}
              onClick={() => void save('PUBLISHED')}
            >
              {t('Save changes')}
            </TaskButton>
          ) : (
            <>
              <TaskButton
                isDisabled={!canSave}
                onClick={() => void save('DRAFT')}
              >
                {t('Save draft')}
              </TaskButton>
              <TaskButton
                variant="primary"
                isDisabled={!canSave}
                onClick={() => void save('PUBLISHED')}
              >
                {t('Publish')}
              </TaskButton>
            </>
          )}
        </>
      }
    >
      <TaskDialogField label={t('Title')}>
        <TaskTextInput
          value={input.title}
          onChange={(title) => update({ title })}
          ariaLabel={t('Title')}
          placeholder={t('What changed, in one line')}
          shouldAutoFocus={isNew}
        />
      </TaskDialogField>

      <TaskDialogField label={t('Category')} isGroup>
        <div
          role="radiogroup"
          aria-label={t('Category')}
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          }}
        >
          {RELEASE_NOTIFICATION_CATEGORY_OPTIONS.map((option) => (
            <CategoryOption
              key={option.value}
              category={option.value}
              isSelected={input.category === option.value}
              onSelect={() => update({ category: option.value })}
            />
          ))}
        </div>
      </TaskDialogField>

      <div
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <TaskDialogField label={t('Version')}>
          <TaskTextInput
            value={input.version}
            onChange={(version) => update({ version })}
            ariaLabel={t('Version')}
            placeholder="v2.4.0"
          />
        </TaskDialogField>
        <TaskDialogField label={t('Release date')}>
          <TaskTextInput
            type="date"
            value={input.releaseDate ?? ''}
            onChange={(releaseDate) =>
              update({ releaseDate: releaseDate === '' ? null : releaseDate })
            }
            ariaLabel={t('Release date')}
          />
        </TaskDialogField>
      </div>

      <TaskDialogField label={t('Doc link')}>
        <TaskTextInput
          value={input.linkDocUrl}
          onChange={(linkDocUrl) => update({ linkDocUrl })}
          ariaLabel={t('Doc link')}
          placeholder="https://docs.example.com/…"
          prefixIcon={<IconLink size={14} color={TASK_TOKENS.textTertiary} />}
        />
      </TaskDialogField>

      <TaskDialogField label={t('Content')} isGroup>
        <TaskRichTextEditor
          value={input.contentMarkdown}
          onChange={(contentMarkdown) => update({ contentMarkdown })}
          placeholder={t('Describe the release for merchants…')}
          minHeight={220}
        />
      </TaskDialogField>
    </TaskDialogFrame>
  );
};

const CategoryOption = ({
  category,
  isSelected,
  onSelect,
}: {
  category: ReleaseNotificationCategory;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const tone = readReleaseCategoryTone(category);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      style={{
        alignItems: 'center',
        background: isSelected ? tone.background : TASK_TOKENS.background,
        border: `1px solid ${isSelected ? tone.text : TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        boxSizing: 'border-box',
        color: isSelected ? tone.text : TASK_TOKENS.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 13,
        fontWeight: isSelected ? 600 : 500,
        gap: 8,
        height: 40,
        minWidth: 0,
        padding: '0 10px',
      }}
    >
      <ReleaseCategoryIcon category={category} size={22} />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {readReleaseCategoryLabel(category)}
      </span>
    </button>
  );
};
