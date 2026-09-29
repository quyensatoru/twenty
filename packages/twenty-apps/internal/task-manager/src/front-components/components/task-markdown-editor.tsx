import { type ReactNode, useRef, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconBlockquote,
  IconBold,
  IconCode,
  IconH2,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
} from 'twenty-ui/icon';

import {
  applyMarkdownFormat,
  buildMarkdownForUrl,
  type MarkdownFormat,
} from '../../utils/apply-markdown-format.util';
import { deriveCaretPosition } from '../../utils/derive-caret-position.util';
import { isImageUrl } from '../../utils/parse-markdown-inline.util';
import { replaceMarkdownLinkUrl } from '../../utils/replace-markdown-link-url.util';
import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { readTextareaSelection } from '../utils/read-textarea-selection.util';
import {
  uploadImageFromUrl,
  type UploadImageFromUrlFailure,
} from '../utils/upload-image-from-url.util';
import { getTaskControlStyle } from './task-control-styles';
import { TaskIconButton } from './task-icon-button';
import { TaskMarkdownView } from './task-markdown-view';
import { TASK_TOKENS } from './task-tokens';

type TaskMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  rows?: number;
};

type ToolbarAction = {
  format: MarkdownFormat;
  label: string;
  placeholder: string;
  icon: ReactNode;
};

const URL_ONLY_PATTERN = /^\s*(https?:\/\/[^\s]+)\s*$/;

// Local files reach the workspace through the host's own picker on the
// Attachments field, which is why that field exists at all. Written as a
// literal inside t() because the extractor only sees literals.
const readLocalFileGuidance = (): string =>
  t(
    'A file from your computer cannot be dropped or pasted here. Add it in the Attachments field on the Issue tab, then paste its link. Pasting an image URL does work — the image is stored in Twenty.',
  );

const readUploadFailureMessage = (
  failure: UploadImageFromUrlFailure,
): string => {
  switch (failure) {
    case 'no-attachment-field':
      return t(
        'The Attachments field is missing, so the image stays linked to its original address.',
      );
    case 'fetch-blocked':
      return t(
        'That address could not be read from here, so the image stays linked to it.',
      );
    case 'not-an-image':
      return t(
        'That address did not return an image, so it stays a plain link.',
      );
    case 'upload-failed':
      return t(
        'The image could not be stored in Twenty, so it stays linked to its original address.',
      );
  }
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    format: 'bold',
    label: 'Bold',
    placeholder: 'bold text',
    icon: <IconBold size={14} />,
  },
  {
    format: 'italic',
    label: 'Italic',
    placeholder: 'italic text',
    icon: <IconItalic size={14} />,
  },
  {
    format: 'code',
    label: 'Code',
    placeholder: 'code',
    icon: <IconCode size={14} />,
  },
  {
    format: 'heading',
    label: 'Heading',
    placeholder: 'Heading',
    icon: <IconH2 size={14} />,
  },
  {
    format: 'bulletList',
    label: 'Bulleted list',
    placeholder: 'List item',
    icon: <IconList size={14} />,
  },
  {
    format: 'numberedList',
    label: 'Numbered list',
    placeholder: 'List item',
    icon: <IconListNumbers size={14} />,
  },
  {
    format: 'quote',
    label: 'Quote',
    placeholder: 'Quote',
    icon: <IconBlockquote size={14} />,
  },
  {
    format: 'link',
    label: 'Link',
    placeholder: 'link text',
    icon: <IconLink size={14} />,
  },
];

// Markdown source in a textarea with a formatting toolbar and a rendered
// preview, because a WYSIWYG editor cannot exist here: the sandbox has no
// contentEditable remote element and no Selection API, so BlockNote and
// ProseMirror have nothing to attach to.
export const TaskMarkdownEditor = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
  rows = 4,
}: TaskMarkdownEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPreviewShown, setIsPreviewShown] = useState(false);
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);
  // The host applies the pasted text natively and only then fires the change,
  // so the URL is rewritten on the way through that change rather than by
  // cancelling the paste — a remote event's preventDefault never reaches the
  // host element.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingPastedUrlRef = useRef<string | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const lastValueRef = useRef(value);

  const applyFormat = (action: ToolbarAction) => {
    const selection = selectionRef.current ?? {
      start: value.length,
      end: value.length,
    };

    const result = applyMarkdownFormat({
      value,
      selectionStart: selection.start,
      selectionEnd: selection.end,
      format: action.format,
      placeholder: t(action.placeholder),
    });

    selectionRef.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    lastValueRef.current = result.value;
    onChange(result.value);
  };


  const rememberSelection = (eventTarget: unknown) => {
    const selection = readTextareaSelection(eventTarget);

    if (selection !== null) {
      selectionRef.current = selection;
    }
  };

  const commit = (nextValue: string, caretPosition: number) => {
    selectionRef.current = { start: caretPosition, end: caretPosition };
    lastValueRef.current = nextValue;
    report(nextValue);
    onChange(nextValue);
  };

  // Rewrites the text the host element already holds. The raw value is reported
  // so useStableFieldValue knows it was typed, and the replacement is not, so
  // the field remounts and the box actually shows the markdown.
  const replaceTypedValue = (
    typedValue: string,
    nextValue: string,
    caretPosition: number,
  ) => {
    report(typedValue);
    selectionRef.current = { start: caretPosition, end: caretPosition };
    lastValueRef.current = nextValue;
    onChange(nextValue);
  };

  // The markdown link is written the moment the paste lands and only its target
  // is swapped once the upload finishes, so a slow or blocked upload costs the
  // author nothing: the URL they pasted is already in the text.
  const storePastedImage = async (sourceUrl: string) => {
    const result = await uploadImageFromUrl(sourceUrl);

    if (result.status === 'already-stored') {
      return;
    }

    if (result.status === 'failed') {
      void enqueueSnackbar({
        message: readUploadFailureMessage(result.failure),
        variant: 'warning',
      });

      return;
    }

    const replacement = replaceMarkdownLinkUrl(
      lastValueRef.current,
      sourceUrl,
      result.url,
    );

    // The author deleted the link while it was uploading. The stored file is
    // theirs to attach from the Attachments field; the text is left as it is.
    if (replacement === null) {
      return;
    }

    replaceTypedValue(
      lastValueRef.current,
      replacement.value,
      replacement.caretPosition,
    );

    void enqueueSnackbar({
      message: t('Image stored in Twenty.'),
      variant: 'success',
    });
  };

  const handleChange = (nextValue: string) => {
    const pastedUrl = pendingPastedUrlRef.current;
    const caretPosition = deriveCaretPosition(lastValueRef.current, nextValue);

    pendingPastedUrlRef.current = null;

    if (pastedUrl !== null && nextValue.includes(pastedUrl)) {
      const insertionIndex = nextValue.lastIndexOf(pastedUrl);
      const isImage = isImageUrl(pastedUrl);
      const markdown = buildMarkdownForUrl(pastedUrl, isImage);
      const rewritten =
        nextValue.slice(0, insertionIndex) +
        markdown +
        nextValue.slice(insertionIndex + pastedUrl.length);

      replaceTypedValue(
        nextValue,
        rewritten,
        insertionIndex + markdown.length,
      );

      if (isImage) {
        void storePastedImage(pastedUrl);
      }

      return;
    }

    commit(nextValue, caretPosition);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        role="toolbar"
        aria-label={t('Formatting')}
        style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 2 }}
      >
        {TOOLBAR_ACTIONS.map((action) => (
          <TaskIconButton
            key={action.format}
            label={t(action.label)}
            onClick={() => applyFormat(action)}
          >
            {action.icon}
          </TaskIconButton>
        ))}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          aria-pressed={isPreviewShown}
          onClick={() => setIsPreviewShown((current) => !current)}
          style={{
            background: 'transparent',
            border: 'none',
            color: isPreviewShown
              ? TASK_TOKENS.accent
              : TASK_TOKENS.textTertiary,
            cursor: 'pointer',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 11,
            padding: 0,
          }}
        >
          {isPreviewShown ? t('Edit') : t('Preview')}
        </button>
      </div>

      {isPreviewShown ? (
        <div
          style={{
            ...getTaskControlStyle(false),
            minHeight: rows * 20,
            padding: 8,
          }}
        >
          <TaskMarkdownView
            markdown={value}
            emptyText={t('Nothing to preview yet.')}
          />
        </div>
      ) : (
        <textarea
          key={fieldKey}
          aria-label={ariaLabel}
          value={fieldValue}
          rows={rows}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyUp={(event) => rememberSelection(event.target)}
          onMouseUp={(event) => rememberSelection(event.target)}
          onClick={(event) => rememberSelection(event.target)}
          onPaste={(event) => {
            const clipboardText = event.clipboardData?.getData('text') ?? '';

            // A pasted file arrives with no text at all: the host reconstructs
            // the clipboard from its text only, and there is no format through
            // which the bytes could follow. Point at the control that does take
            // a file rather than dropping the paste in silence.
            if (clipboardText === '') {
              void enqueueSnackbar({
                message: readLocalFileGuidance(),
                variant: 'info',
              });

              return;
            }

            const urlMatch = URL_ONLY_PATTERN.exec(clipboardText);

            pendingPastedUrlRef.current =
              urlMatch === null ? null : urlMatch[1];
          }}
          onDrop={() => {
            // A dropped file's bytes never cross into the sandbox either: the
            // host serialises an event to name, size and type only, and only
            // from a file input's own `files`, never from `dataTransfer`.
            void enqueueSnackbar({
              message: readLocalFileGuidance(),
              variant: 'info',
            });
          }}
          onChange={(event) => {
            rememberSelection(event.target);
            handleChange(event.target.value);
          }}
          style={{
            ...getTaskControlStyle(isFocused),
            fontFamily: TASK_TOKENS.fontFamily,
            lineHeight: 1.5,
            padding: 8,
            resize: 'vertical',
          }}
        />
      )}
    </div>
  );
};
