import { readTransferredFiles } from './read-transferred-files.util';
import {
  isTransferredImageFile,
  type TransferredFile,
} from './upload-image-from-transferred-file.util';

export type PasteIntent =
  // The clipboard carried files. `nativePastedText` is what the browser is
  // about to drop into the box on its own — on Linux a copied screenshot
  // carries its path as text/plain beside the file — and has to be taken back
  // out, because the host cancels dragover and drop but never paste.
  | {
      kind: 'files';
      imageFiles: TransferredFile[];
      nativePastedText: string | null;
    }
  | { kind: 'url'; url: string }
  | { kind: 'plain-text' };

const URL_ONLY_PATTERN = /^\s*(https?:\/\/[^\s]+)\s*$/;

export const resolvePasteIntent = ({
  clipboardText,
  transfer,
}: {
  clipboardText: string;
  transfer: unknown;
}): PasteIntent => {
  const transferredFiles = readTransferredFiles(transfer);

  // Files win over the text half: the text is only the file's name or path,
  // never something the author meant to paste.
  if (transferredFiles.length > 0) {
    return {
      kind: 'files',
      imageFiles: transferredFiles.filter(isTransferredImageFile),
      nativePastedText: clipboardText === '' ? null : clipboardText,
    };
  }

  const urlMatch = URL_ONLY_PATTERN.exec(clipboardText);

  return urlMatch === null ? { kind: 'plain-text' } : { kind: 'url', url: urlMatch[1] };
};
