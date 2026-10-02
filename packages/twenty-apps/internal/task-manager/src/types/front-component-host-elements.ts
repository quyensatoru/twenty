// Stopgap: the canonical declaration of the host-rendered JSX elements lives in
// twenty-sdk's `front-component` entry, but this app is pinned to a published
// SDK that predates it. Delete this file once the pinned version ships it.
import { type ReactNode } from 'react';

// The bytes never cross into the sandbox: the editor describes the file the
// user handed it and sends a single-use handle to spend through
// uploadFileByHandle.
export type RichTextTransferredFile = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  handle?: string;
};

export type RichTextUploadEvent = {
  detail: { files?: RichTextTransferredFile[] };
};

// The answer the editor is waiting for. A null url tells it the file was not
// stored, so it stops showing one as arriving.
export type RichTextUploadResolution = {
  handle: string;
  url: string | null;
};

// Host-rendered: a widget clips what it contains and paints in its own
// stacking context, and a click outside the component never reaches the guest,
// so a dropdown drawn inline is cut off, covered, and unable to dismiss itself.
export type OverlayAttributes = {
  offsetX?: number;
  offsetY?: number;
  onClose?: () => void;
  children?: ReactNode;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'twenty-rich-text-editor': {
        value?: string;
        placeholder?: string;
        isReadOnly?: boolean;
        resolvedUploads?: RichTextUploadResolution[];
        onChange?: (event: {
          target: { value: string };
          detail: { value: string };
        }) => void;
        onBlur?: () => void;
        onUpload?: (event: RichTextUploadEvent) => void;
      };
      'twenty-overlay': OverlayAttributes;
    }
  }
}
