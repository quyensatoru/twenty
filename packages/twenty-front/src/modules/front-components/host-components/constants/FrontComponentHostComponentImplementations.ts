import { type FrontComponentHostImplementations } from 'twenty-front-component-renderer';

import { FrontComponentRichTextEditor } from '@/front-components/host-components/components/FrontComponentRichTextEditor';

// The renderer declares these elements but cannot implement them: they are
// built on libraries that live here, and twenty-front is what depends on the
// renderer, never the other way round.
export const FRONT_COMPONENT_HOST_COMPONENT_IMPLEMENTATIONS: FrontComponentHostImplementations =
  {
    'twenty-rich-text-editor': FrontComponentRichTextEditor,
  };
