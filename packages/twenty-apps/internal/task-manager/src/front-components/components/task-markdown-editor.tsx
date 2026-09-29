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
import { appendImageMarkdown as buildValueWithImageMarkdown } from '../../utils/append-image-markdown.util';
import { deriveCaretPosition } from '../../utils/derive-caret-position.util';
import { isImageUrl } from '../../utils/parse-markdown-inline.util';
import { removeNativePasteInsertion } from '../../utils/remove-native-paste-insertion.util';
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
import { TaskMarkdownView } from './task-markdown-view';
import { TASK_TOKENS } from './task-tokens';

type TaskMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  ariaLabel: string;
  placeholder?: string;
  rows?: number;
  // Shows the rendered markdown until the author clicks into the text, instead
  // of a permanently open source box.
  isClickToEdit?: boolean;
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
  isClickToEdit = false,
}: TaskMarkdownEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { fieldValue, fieldKey, report, reset } = useStableFieldValue(value);
  // The host applies the pasted text natively and only then fires the change,
  // so the URL is rewritten on the way through that change rather than by
  // cancelling the paste — a remote event's preventDefault never reaches the
  // host element.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingPastedUrlRef = useRef<string | null>(null);
  // Set when a paste was claimed as a file, so the text the browser inserted
  // alongside it can be recognised in the change that follows.
  // oxlint-disable-next-line twenty/no-state-useref
  const pendingNativePasteTextRef = useRef<string | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  // oxlint-disable-next-line twenty/no-state-useref
  const lastValueRef = useRef(value);
  // Read inside the blur handler, which can run before a render caused by the
  // pointer leaving has flushed, so state alone would be stale there.
  // oxlint-disable-next-line twenty/no-state-useref
  const isPointerInsideRef = useRef(false);
  // oxlint-disable-next-line twenty/no-state-useref
  const isFocusedRef = useRef(false);

  // Leaving edit mode while the pointer is still inside would unmount the
  // toolbar between the button's mousedown — which is what blurred the box —
  // and its mouseup, so the click would never land.
  const handleTextareaFocus = () => {
    isFocusedRef.current = true;
    setIsFocused(true);
    setIsEditing(true);
  };

  const handleTextareaBlur = () => {
    isFocusedRef.current = false;
    setIsFocused(false);

    if (!isPointerInsideRef.current) {
      setIsEditing(false);
    }

    onBlur?.();
  };

  const handlePointerEnter = () => {
    isPointerInsideRef.current = true;
    setIsPointerInside(true);
  };

  const handlePointerLeave = () => {
    isPointerInsideRef.current = false;
    setIsPointerInside(false);

    if (!isFocusedRef.current) {
      setIsEditing(false);
    }
  };

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

  // Puts back the text the box held before the host applied a paste of its own.
  // The reverted value was typed already, so the field has to be told to take
  // it again — otherwise the box keeps showing what the host pasted.
  const revertNativePaste = (
    typedValue: string,
    revertedValue: string,
    caretPosition: number,
  ) => {
    report(typedValue);
    selectionRef.current = { start: caretPosition, end: caretPosition };
    lastValueRef.current = revertedValue;
    reset(revertedValue);
    onChange(revertedValue);
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

  const appendImageMarkdown = (name: string, url: string) => {
    const currentValue = lastValueRef.current;
    const nextValue = buildValueWithImageMarkdown(currentValue, name, url);

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
    const nativePasteText = pendingNativePasteTextRef.current;
    const caretPosition = deriveCaretPosition(lastValueRef.current, nextValue);

    pendingPastedUrlRef.current = null;
    pendingNativePasteTextRef.current = null;

    if (nativePasteText !== null) {
      const removal = removeNativePasteInsertion(
        lastValueRef.current,
        nextValue,
        nativePasteText,
      );

      if (removal !== null) {
        revertNativePaste(nextValue, removal.value, removal.caretPosition);

        return;
      }
    }

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

  const toolbar = (
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
  );

  const textarea = (
    <textarea
      key={fieldKey}
      aria-label={ariaLabel}
      value={fieldValue}
      rows={rows}
      placeholder={isClickToEdit ? undefined : placeholder}
      onFocus={handleTextareaFocus}
      onBlur={handleTextareaBlur}
      onKeyUp={(event) => rememberSelection(event.target)}
      onMouseUp={(event) => rememberSelection(event.target)}
      onClick={(event) => rememberSelection(event.target)}
      onPaste={(event) => {
        const clipboardText = event.clipboardData?.getData('text') ?? '';

        if (handleTransferredFiles(event.clipboardData)) {
          // The paste is not cancelled — the host only cancels dragover and
          // drop — so the path the clipboard carries beside the file still
          // lands in the box. It is taken back out when the change arrives.
          pendingNativePasteTextRef.current =
            clipboardText === '' ? null : clipboardText;

          return;
        }

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
        resize: isClickToEdit ? 'none' : 'vertical',
        ...(isClickToEdit
          ? { gridArea: '1 / 1', height: '100%', opacity: isEditing ? 1 : 0 }
          : {}),
      }}
    />
  );

  if (!isClickToEdit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {toolbar}
        {textarea}
      </div>
    );
  }

  // The rendered markdown is an overlay that lets the pointer through, so the
  // text the author sees IS the click target: the click reaches the textarea
  // underneath and the browser puts the caret where they aimed. Focusing it
  // from here is not an option — `autofocus` is not one of the properties the
  // renderer forwards to a remote textarea, and the sandbox has no element
  // reference to call focus() on.
  //
  // The toolbar sits below the field so that showing it does not push the text
  // down under the pointer mid-click.
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        gap: 4,
        minHeight: 0,
      }}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
    >
      <div
        style={{
          background:
            !isEditing && isPointerInside
              ? TASK_TOKENS.backgroundHover
              : 'transparent',
          borderRadius: TASK_TOKENS.radiusSmall,
          cursor: 'text',
          display: 'grid',
          flex: 1,
          minHeight: 0,
        }}
      >
        {textarea}
        <div
          style={{
            gridArea: '1 / 1',
            opacity: isEditing ? 0 : 1,
            // The grid row is a fixed pixel budget, so text longer than the
            // widget has to scroll. Reading it needs a click into the box:
            // letting the pointer through is what makes the text itself the
            // click target, and a scrollable overlay cannot do both.
            overflowY: 'auto',
            padding: 9,
            pointerEvents: 'none',
          }}
        >
          <TaskMarkdownView markdown={value} emptyText={placeholder} />
        </div>
      </div>
      {isEditing && toolbar}
    </div>
  );
};
