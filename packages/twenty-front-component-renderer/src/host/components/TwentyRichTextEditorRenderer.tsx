import { useContext, useEffect, useRef } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { FrontComponentInputFocusContext } from '@/host/caret/contexts/FrontComponentInputFocusContext';

import { useFrontComponentHostImplementation } from '@/host/component-implementations/hooks/useFrontComponentHostImplementation';
import { FrontComponentRichTextEditorFallback } from '@/host/components/FrontComponentRichTextEditorFallback';
import { serializeTransferredFile } from '@/host/events/utils/serializeTransferredFile';
import { createFrontComponentUploadAnswerRegistry } from '@/host/uploads/utils/createFrontComponentUploadAnswerRegistry';
import { type FrontComponentUploadResolution } from '@/types/FrontComponentUploadResolution';
import { type SerializedEventData } from '@/types/SerializedEventData';

type TwentyRichTextEditorRendererProps = {
  value?: string;
  placeholder?: string;
  isReadOnly?: boolean;
  resolvedUploads?: FrontComponentUploadResolution[];
  onChange?: (eventData: SerializedEventData) => void;
  onBlur?: (eventData: SerializedEventData) => void;
  onUpload?: (eventData: SerializedEventData) => void;
};

export const TwentyRichTextEditorRenderer = ({
  value,
  placeholder,
  isReadOnly,
  resolvedUploads,
  onChange,
  onBlur,
  onUpload,
}: TwentyRichTextEditorRendererProps) => {
  const RichTextEditorImplementation = useFrontComponentHostImplementation(
    'twenty-rich-text-editor',
  );
  const setEditableFocused = useContext(FrontComponentInputFocusContext);

  // Not state: an upload settling must not re-render the editor, and the
  // registry is held by the implementation for as long as it lives.
  // oxlint-disable-next-line twenty/no-state-useref
  const uploadAnswersRef = useRef(createFrontComponentUploadAnswerRegistry());
  // oxlint-disable-next-line twenty/no-state-useref
  const onUploadRef = useRef(onUpload);
  onUploadRef.current = onUpload;

  useEffect(() => {
    const uploadAnswers = uploadAnswersRef.current;

    // Unmounting mid-upload would otherwise leave the implementation awaiting
    // an answer that can no longer arrive.
    return () => uploadAnswers.abandonAll();
  }, []);

  useEffect(() => {
    uploadAnswersRef.current.applyResolutions(resolvedUploads ?? []);
  }, [resolvedUploads]);

  const handleUploadFile = (file: File): Promise<string | null> => {
    const sendUpload = onUploadRef.current;

    if (!isDefined(sendUpload)) {
      return Promise.resolve(null);
    }

    const serializedFile = serializeTransferredFile(file);
    const handle = serializedFile.handle;

    if (!isDefined(handle)) {
      return Promise.resolve(null);
    }

    const answer = uploadAnswersRef.current.waitForAnswer(handle);

    sendUpload({ type: 'upload', files: [serializedFile] });

    return answer;
  };

  // The guest reads the new text off `event.target.value`, the same shape a
  // textarea change carries, so app code does not learn a second convention.
  const handleChange = (nextValue: string): void =>
    onChange?.({ type: 'change', value: nextValue });

  const ResolvedRichTextEditor = isDefined(RichTextEditorImplementation)
    ? RichTextEditorImplementation
    : FrontComponentRichTextEditorFallback;

  return (
    <ResolvedRichTextEditor
      value={value ?? ''}
      placeholder={placeholder}
      isReadOnly={isReadOnly ?? false}
      onChange={handleChange}
      onUploadFile={handleUploadFile}
      onFocus={() => setEditableFocused?.(true)}
      onBlur={() => {
        // Without this the embedder's global shortcuts keep firing on every
        // letter typed into a host component, the same way they would inside
        // one of its own text inputs.
        setEditableFocused?.(false);
        onBlur?.({ type: 'blur' });
      }}
    />
  );
};
