// The contract an injected rich text editor sees. It is deliberately free of
// bridge concerns: the tag renderer translates between this and the remote
// element's properties and events.
export type FrontComponentRichTextEditorImplementationProps = {
  value: string;
  placeholder?: string;
  isReadOnly: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  // Stores a file the user pasted, dropped or picked and answers with the URL
  // it now lives at, or null when it could not be stored. The editor never
  // uploads by itself: the guest owns the credentials and the scope the file
  // has to be filed under, so every byte leaves through here.
  onUploadFile: (file: File) => Promise<string | null>;
};
