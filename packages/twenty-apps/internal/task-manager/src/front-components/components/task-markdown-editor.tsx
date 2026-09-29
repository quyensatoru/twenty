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
import { readTransferredFiles } from '../utils/read-transferred-files.util';
import {
  isTransferredImageFile,
  uploadImageFromTransferredFile,
  type TransferredFile,
  type UploadImageFromTransferredFileFailure,
} from '../utils/upload-image-from-transferred-file.util';
import {
  uploadImageFromUrl,
  type UploadImageFromUrlFailure,
} from '../utils/upload-image-from-url.util';
import { getTaskControlStyle } from './task-control-styles';
import { TaskIconButton } from './task-icon-button';
import { TASK_TOKENS } from './task-tokens';

type TaskMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
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

// Only images become markdown here. Anything else still belongs in the
// Attachments field, which is where the host's own picker puts it. Written as
// a literal inside t() because the extractor only sees literals.
const readNonImageFileGuidance = (): string =>
  t(
    'Only an image can be pasted or dropped here. Add any other file in the Attachments field on the Issue tab.',
  );

const readTransferredUploadFailureMessage = (
  failure: UploadImageFromTransferredFileFailure,
): string => {
  switch (failure) {
    case 'host-too-old':
      return t(
        'This Twenty server cannot receive a pasted or dropped file yet. Add the image in the Attachments field on the Issue tab.',
      );
    case 'no-attachment-field':
      return t(
        'The Attachments field is missing, so the image could not be stored.',
      );
    case 'upload-failed':
      return t('The image could not be stored in Twenty.');
  }
};

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

// Markdown source in a textarea with a formatting toolbar, because a WYSIWYG
// editor cannot exist here: the sandbox has no contentEditable remote element
// and no Selection API, so BlockNote and ProseMirror have nothing to attach to.
// Rendering is every caller's own business — each one already shows saved
// markdown through TaskMarkdownView.
export const TaskMarkdownEditor = ({
  value,
  onChange,
  onBlur,
  ariaLabel,
  placeholder,
  rows = 4,
}: TaskMarkdownEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
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

  // The caret is not serialised onto a remote element, so an upload that lands
  // while the author keeps typing appends at the end of what they have now
  // rather than at a position that no longer means anything.
  const appendImageMarkdown = (name: string, url: string) => {
    const currentValue = lastValueRef.current;
    const separator =
      currentValue === '' || currentValue.endsWith('\n') ? '' : '\n';
    const markdown = `${separator}![${name}](${url})`;
    const nextValue = currentValue + markdown;

    replaceTypedValue(currentValue, nextValue, nextValue.length);
  };

  // The bytes stayed on the host: each file arrives as a single-use handle and
  // the host uploads the file it kept, so the markdown can only be written once
  // the URL comes back.
  const storeTransferredImages = async (files: TransferredFile[]) => {
    for (const file of files) {
      const result = await uploadImageFromTransferredFile(file);

      if (result.status === 'failed') {
        void enqueueSnackbar({
          message: readTransferredUploadFailureMessage(result.failure),
          variant: 'warning',
        });

        continue;
      }

      appendImageMarkdown(result.name, result.url);

      void enqueueSnackbar({
        message: t('Image stored in Twenty.'),
        variant: 'success',
      });
    }
  };

  // Returns true when the event carried files and was dealt with here.
  const handleTransferredFiles = (transfer: unknown): boolean => {
    const transferredFiles = readTransferredFiles(transfer);

    if (transferredFiles.length === 0) {
      return false;
    }

    const imageFiles = transferredFiles.filter(isTransferredImageFile);

    if (imageFiles.length === 0) {
      void enqueueSnackbar({
        message: readNonImageFileGuidance(),
        variant: 'info',
      });

      return true;
    }

    void storeTransferredImages(imageFiles);

    return true;
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
      </div>

      <textarea
        key={fieldKey}
        aria-label={ariaLabel}
        value={fieldValue}
        rows={rows}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onKeyUp={(event) => rememberSelection(event.target)}
        onMouseUp={(event) => rememberSelection(event.target)}
        onClick={(event) => rememberSelection(event.target)}
        onPaste={(event) => {
          if (handleTransferredFiles(event.clipboardData)) {
            return;
          }

          const clipboardText = event.clipboardData?.getData('text') ?? '';

          if (clipboardText === '') {
            return;
          }

          const urlMatch = URL_ONLY_PATTERN.exec(clipboardText);

          pendingPastedUrlRef.current = urlMatch === null ? null : urlMatch[1];
        }}
        onDragOver={() => {
          // Registering the handler is how the host learns to cancel the
          // browser's own drop, which would otherwise navigate to the file.
        }}
        onDrop={(event) => {
          handleTransferredFiles(event.dataTransfer);
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
    </div>
  );
};
