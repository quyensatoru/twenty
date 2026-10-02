import { type ReactNode } from 'react';

// Host-rendered elements a front component can write as JSX. They have no HTML
// counterpart: the guest sets properties and listens to events while the host
// owns the DOM, which is how a front component reaches capabilities the
// worker's stub DOM does not have, such as a rich text editor.

export type FrontComponentRichTextEditorChangeEvent = {
  target: { value: string };
  detail: { value: string };
};

// The bytes never cross into the sandbox. A file the user pasted, dropped or
// picked is described by its metadata plus a single-use handle to spend
// through uploadFileByHandle.
export type FrontComponentTransferredFile = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  handle?: string;
};

export type FrontComponentRichTextEditorUploadEvent = {
  detail: { files?: FrontComponentTransferredFile[] };
};

// What the editor is waiting for: the handle it sent, and where the guest put
// the file. A null url tells it the file was not stored.
export type FrontComponentRichTextEditorUploadResolution = {
  handle: string;
  url: string | null;
};

export type FrontComponentRichTextEditorAttributes = {
  value?: string;
  placeholder?: string;
  isReadOnly?: boolean;
  resolvedUploads?: FrontComponentRichTextEditorUploadResolution[];
  onChange?: (event: FrontComponentRichTextEditorChangeEvent) => void;
  onBlur?: () => void;
  onUpload?: (event: FrontComponentRichTextEditorUploadEvent) => void;
  key?: string | number;
  children?: ReactNode;
};

// An overlay is rendered by the host, outside the front component's own box:
// a widget clips what it contains and paints inside its own stacking context,
// so a dropdown written inline is cut off and covered. It anchors to the
// element it is written inside, and `onClose` fires when the user clicks
// anywhere else or presses Escape, which the guest cannot observe for itself.
export type FrontComponentOverlayAttributes = {
  offsetX?: number;
  offsetY?: number;
  onClose?: () => void;
  key?: string | number;
  children?: ReactNode;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'twenty-rich-text-editor': FrontComponentRichTextEditorAttributes;
      'twenty-overlay': FrontComponentOverlayAttributes;
    }
  }
}
