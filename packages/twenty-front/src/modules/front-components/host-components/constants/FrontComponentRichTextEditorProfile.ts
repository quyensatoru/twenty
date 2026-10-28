import { type AdvancedTextEditorProfile } from '@/advanced-text-editor/types/AdvancedTextEditorProfile';
import { buildMarkdownRichTextExtensions } from '@/front-components/host-components/utils/buildMarkdownRichTextExtensions';
import { parseMarkdownAsEditorContent } from '@/front-components/host-components/utils/parseMarkdownAsEditorContent';

export const FRONT_COMPONENT_RICH_TEXT_EDITOR_PROFILE = {
  chrome: 'document',
  variant: 'app',
  minHeight: 0,
  enableFullScreen: false,
  parseLegacyDocument: parseMarkdownAsEditorContent,
  buildExtensions: buildMarkdownRichTextExtensions,
} satisfies AdvancedTextEditorProfile;
