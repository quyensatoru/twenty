import { Blockquote } from '@/advanced-text-editor/extensions/blockquote/Blockquote';
import { RichTextDividerNode } from '@/advanced-text-editor/extensions/blocks/RichTextDividerNode';
import { EmptyBlockHint } from '@/advanced-text-editor/extensions/empty-block-hint/EmptyBlockHint';
import { FileNode } from '@/advanced-text-editor/extensions/file/FileNode';
import { ResizableImage } from '@/advanced-text-editor/extensions/resizable-image/ResizableImage';
import { SlashCommand } from '@/advanced-text-editor/extensions/slash-command/SlashCommand';
import { UploadExtension } from '@/advanced-text-editor/extensions/upload/UploadExtension';
import { type AdvancedTextEditorExtensionContext } from '@/advanced-text-editor/types/AdvancedTextEditorExtensionContext';
import { type AnyExtension } from '@tiptap/core';
import { Bold } from '@tiptap/extension-bold';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Heading } from '@tiptap/extension-heading';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListKit } from '@tiptap/extension-list';
import { Strike } from '@tiptap/extension-strike';
import { TableKit } from '@tiptap/extension-table';
import { Underline } from '@tiptap/extension-underline';
import { isStorableRichTextUrl } from 'twenty-shared/utils';

// The record rich text set minus what markdown cannot hold (colors, alignment,
// toggles, indentation, mentions): the guest stores markdown, so anything
// else would vanish on the next save.
export const buildMarkdownRichTextExtensions = ({
  onImageUpload,
  onImageUploadError,
  onFileUpload,
  onFileUploadError,
}: AdvancedTextEditorExtensionContext): AnyExtension[] => [
  Bold,
  Italic,
  Strike,
  Underline,
  Code,
  Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
  ListKit.configure({ taskItem: { nested: true } }),
  Blockquote,
  CodeBlock,
  TableKit.configure({ table: { resizable: true } }),
  RichTextDividerNode,
  // Autolink makes links inclusive, so text typed right after one (a mention
  // the guest just inserted) would join it.
  Link.extend({ inclusive: () => false }).configure({
    openOnClick: false,
    isAllowedUri: isStorableRichTextUrl,
  }),
  ResizableImage,
  UploadExtension.configure({
    onImageUpload,
    onImageUploadError,
    onFileUpload,
    onFileUploadError,
  }),
  FileNode,
  SlashCommand,
  EmptyBlockHint,
];
