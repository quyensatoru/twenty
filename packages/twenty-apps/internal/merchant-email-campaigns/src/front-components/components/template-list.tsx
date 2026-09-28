import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { DEFAULT_EMAIL_DESIGN } from '../../constants/default-email-design';
import { type TemplateRow } from '../../types/template-row';
import { createTemplate } from '../utils/create-template.util';
import { deleteTemplate } from '../utils/delete-template.util';
import { readErrorText } from '../utils/read-error-text.util';
import { StudioButton } from './studio-button';
import { StudioPanel } from './studio-panel';
import { STUDIO_TOKENS } from './studio-tokens';

type TemplateListProps = {
  templates: TemplateRow[];
  onOpen: (templateId: string) => void;
  onChanged: () => Promise<void>;
};

export const TemplateList = ({
  templates,
  onOpen,
  onChanged,
}: TemplateListProps) => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleCreate = async (source?: TemplateRow) => {
    setBusyId(source?.id ?? 'new');

    try {
      const id = await createTemplate({
        name: source
          ? t('{name} (copy)', { name: source.name ?? t('Template') })
          : t('Untitled template'),
        subject: source?.subject ?? 'Welcome to {{appName}}',
        previewText: source?.previewText ?? '',
        design: source?.design ?? DEFAULT_EMAIL_DESIGN,
      });

      await onChanged();
      onOpen(id);
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (template: TemplateRow) => {
    setBusyId(template.id);

    try {
      await deleteTemplate(template.id);
      await onChanged();
      enqueueSnackbar({ message: t('Template deleted'), variant: 'success' });
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <StudioPanel
      title={`${t('Templates')} (${templates.length})`}
      actions={
        <StudioButton
          variant="primary"
          onClick={() => handleCreate()}
          isDisabled={busyId !== null}
        >
          {t('New template')}
        </StudioButton>
      }
    >
      {templates.length === 0 ? (
        <p
          style={{
            color: STUDIO_TOKENS.textSecondary,
            fontSize: 13,
            margin: 0,
          }}
        >
          {t('No templates yet. Create one to design your first email.')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                alignItems: 'center',
                borderTop: `1px solid ${STUDIO_TOKENS.border}`,
                display: 'flex',
                gap: 8,
                padding: '10px 0',
              }}
            >
              <button
                type="button"
                onClick={() => onOpen(template.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                  padding: 0,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    color: STUDIO_TOKENS.textPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {template.name || t('Untitled template')}
                </span>
                <span
                  style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}
                >
                  {template.subject || t('No subject')}
                </span>
              </button>
              <StudioButton variant="ghost" onClick={() => onOpen(template.id)}>
                {t('Edit')}
              </StudioButton>
              <StudioButton
                variant="ghost"
                onClick={() => handleCreate(template)}
                isDisabled={busyId !== null}
              >
                {t('Duplicate')}
              </StudioButton>
              <StudioButton
                variant="danger"
                onClick={() => handleDelete(template)}
                isDisabled={busyId !== null}
              >
                {t('Delete')}
              </StudioButton>
            </div>
          ))}
        </div>
      )}
    </StudioPanel>
  );
};
