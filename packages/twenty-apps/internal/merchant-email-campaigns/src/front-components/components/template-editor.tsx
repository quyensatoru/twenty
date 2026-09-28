import { useMemo, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { SEND_TEST_EMAIL_ROUTE_PATH } from '../../constants/route-paths';
import { type EmailBlock, type EmailBlockType } from '../../types/email-block';
import { type EmailDesign } from '../../types/email-design';
import { type EmailDesignMode } from '../../types/email-design-mode';
import { type TemplateRow } from '../../types/template-row';
import { buildSampleTemplateVariables } from '../../utils/build-sample-template-variables.util';
import { convertBlocksToHtml } from '../../utils/convert-blocks-to-html.util';
import { interpolateTemplate } from '../../utils/interpolate-template.util';
import { parseEmailDesign } from '../../utils/parse-email-design.util';
import { renderEmailHtml } from '../../utils/render-email-html.util';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { createEmailBlock } from '../utils/create-email-block.util';
import { generateBlockId } from '../utils/generate-block-id.util';
import { moveArrayItem } from '../utils/move-array-item.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { updateTemplate } from '../utils/update-template.util';
import { BlockOutline } from './block-outline';
import { BlockPalette } from './block-palette';
import { BlockSettings } from './block-settings';
import { DesignSettings } from './design-settings';
import { EmailPreview } from './email-preview';
import { HtmlDesignEditor } from './html-design-editor';
import { StudioButton } from './studio-button';
import { StudioField } from './studio-field';
import { StudioPanel } from './studio-panel';
import { StudioSegmentedControl } from './studio-segmented-control';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';
import { VariableChips } from './variable-chips';

type TemplateEditorProps = {
  template: TemplateRow;
  onBack: () => void;
  onSaved: (template: TemplateRow) => void;
};

export const TemplateEditor = ({
  template,
  onBack,
  onSaved,
}: TemplateEditorProps) => {
  const [name, setName] = useState(template.name ?? '');
  const [subject, setSubject] = useState(template.subject ?? '');
  const [previewText, setPreviewText] = useState(template.previewText ?? '');
  const [design, setDesign] = useState<EmailDesign>(() =>
    parseEmailDesign(template.design),
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    design.blocks[0]?.id ?? null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const sampleVariables = useMemo(() => buildSampleTemplateVariables(), []);
  const previewSource = useMemo(
    () => ({ design, subject, previewText }),
    [design, subject, previewText],
  );
  const previewInput = useDebouncedValue(previewSource, 350);
  const previewHtml = useMemo(
    () => renderEmailHtml({ ...previewInput, variables: sampleVariables }),
    [previewInput, sampleVariables],
  );

  const selectedBlock =
    design.blocks.find((block) => block.id === selectedBlockId) ?? null;

  const updateDesign = (nextDesign: EmailDesign) => {
    setDesign(nextDesign);
    setIsDirty(true);
  };

  const updateBlocks = (blocks: EmailBlock[]) =>
    updateDesign({ ...design, blocks });

  const handleAddBlock = (type: EmailBlockType) => {
    const block = createEmailBlock(type);
    const selectedIndex = design.blocks.findIndex(
      (item) => item.id === selectedBlockId,
    );
    const insertAt =
      selectedIndex === -1 ? design.blocks.length : selectedIndex + 1;

    updateBlocks([
      ...design.blocks.slice(0, insertAt),
      block,
      ...design.blocks.slice(insertAt),
    ]);
    setSelectedBlockId(block.id);
  };

  const handleDuplicateBlock = (blockId: string) => {
    const index = design.blocks.findIndex((block) => block.id === blockId);

    if (index === -1) {
      return;
    }

    const copy = { ...design.blocks[index], id: generateBlockId() };

    updateBlocks([
      ...design.blocks.slice(0, index + 1),
      copy,
      ...design.blocks.slice(index + 1),
    ]);
    setSelectedBlockId(copy.id);
  };

  const handleRemoveBlock = (blockId: string) => {
    updateBlocks(design.blocks.filter((block) => block.id !== blockId));

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const data = {
        name: name.trim() || t('Untitled template'),
        subject,
        previewText,
        design,
      };

      await updateTemplate(template.id, data);
      setIsDirty(false);
      onSaved({ id: template.id, ...data });
      enqueueSnackbar({ message: t('Template saved'), variant: 'success' });
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);

    try {
      await postAppRoute(SEND_TEST_EMAIL_ROUTE_PATH, {
        to: testRecipient,
        subject,
        previewText,
        design,
      });
      enqueueSnackbar({
        message: t('Test email sent to {email}', { email: testRecipient }),
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const setField = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setIsDirty(true);
  };

  const handleModeChange = (mode: EmailDesignMode) => {
    // The first switch to HTML starts from the block design, so the author
    // edits real markup instead of an empty box.
    updateDesign(
      mode === 'html' && design.html.trim() === ''
        ? { ...design, mode, html: convertBlocksToHtml(design) }
        : { ...design, mode },
    );
  };

  const preview = (
    <StudioPanel>
      <EmailPreview
        html={previewHtml}
        subject={interpolateTemplate(subject, sampleVariables)}
        previewText={interpolateTemplate(previewText, sampleVariables)}
      />
    </StudioPanel>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        minHeight: 0,
      }}
    >
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <StudioButton variant="ghost" onClick={onBack}>
            ← {t('Templates')}
          </StudioButton>
          <StudioSegmentedControl
            value={design.mode}
            options={[
              { value: 'blocks', label: t('Block editor') },
              { value: 'html', label: t('HTML / CSS') },
            ]}
            onChange={handleModeChange}
          />
          <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
            {isDirty ? t('Unsaved changes') : t('All changes saved')}
          </span>
        </div>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ width: 220 }}>
            <StudioTextInput
              type="email"
              value={testRecipient}
              placeholder="you@company.com"
              onChange={setTestRecipient}
            />
          </div>
          <StudioButton
            onClick={handleSendTest}
            isDisabled={isSendingTest || testRecipient.trim() === ''}
            title={t('Sends the current draft with sample data')}
          >
            {isSendingTest ? t('Sending…') : t('Send test')}
          </StudioButton>
          <StudioButton
            variant="primary"
            onClick={handleSave}
            isDisabled={isSaving || !isDirty}
          >
            {isSaving ? t('Saving…') : t('Save')}
          </StudioButton>
        </div>
      </header>

      <StudioPanel>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <StudioField label={t('Template name')}>
            <StudioTextInput value={name} onChange={setField(setName)} />
          </StudioField>
          <StudioField label={t('Subject')}>
            <StudioTextInput
              value={subject}
              placeholder="Welcome to {{appName}}"
              onChange={setField(setSubject)}
            />
          </StudioField>
          <StudioField label={t('Preview text')}>
            <StudioTextInput
              value={previewText}
              placeholder={t('Shown after the subject in the inbox')}
              onChange={setField(setPreviewText)}
            />
          </StudioField>
        </div>
        <VariableChips
          onInsert={(placeholder) =>
            setField(setSubject)(`${subject}${placeholder}`)
          }
        />
        <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 11 }}>
          {t(
            'Variable buttons here add to the subject; the ones in the editor below add to the content. Write {{contactName|there}} for a fallback, and {{event.plan_name}} for a property of the event that fired a custom-event automation.',
          )}
        </span>
      </StudioPanel>

      {design.mode === 'html' ? (
        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 12,
            gridTemplateColumns: 'minmax(420px, 1fr) minmax(360px, 1fr)',
            minHeight: 0,
          }}
        >
          <HtmlDesignEditor design={design} onChange={updateDesign} />
          <div style={{ minHeight: 0 }}>{preview}</div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 12,
            gridTemplateColumns:
              'minmax(220px, 280px) minmax(260px, 340px) minmax(360px, 1fr)',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minHeight: 0,
              overflow: 'auto',
            }}
          >
            <StudioPanel title={t('Add block')}>
              <BlockPalette onAdd={handleAddBlock} />
            </StudioPanel>
            <StudioPanel
              title={t('Blocks')}
              actions={
                <StudioButton
                  variant="ghost"
                  onClick={() => setSelectedBlockId(null)}
                >
                  {t('Email style')}
                </StudioButton>
              }
            >
              <BlockOutline
                blocks={design.blocks}
                selectedBlockId={selectedBlockId}
                onSelect={setSelectedBlockId}
                onMove={(fromIndex, toIndex) =>
                  updateBlocks(moveArrayItem(design.blocks, fromIndex, toIndex))
                }
                onDuplicate={handleDuplicateBlock}
                onRemove={handleRemoveBlock}
              />
            </StudioPanel>
          </div>

          <div style={{ minHeight: 0, overflow: 'auto' }}>
            <StudioPanel>
              {selectedBlock === null ? (
                <DesignSettings
                  settings={design.settings}
                  onChange={(settings) => updateDesign({ ...design, settings })}
                />
              ) : (
                <BlockSettings
                  block={selectedBlock}
                  onChange={(block) =>
                    updateBlocks(
                      design.blocks.map((item) =>
                        item.id === block.id ? block : item,
                      ),
                    )
                  }
                />
              )}
            </StudioPanel>
          </div>

          <div style={{ minHeight: 0 }}>{preview}</div>
        </div>
      )}
    </div>
  );
};
