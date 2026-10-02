import { type ComponentType } from 'react';

import { type FrontComponentRichTextEditorImplementationProps } from '@/host/component-implementations/types/FrontComponentRichTextEditorImplementationProps';

// Every custom element whose host rendering is supplied from outside this
// package. The renderer declares the element and the props contract; the
// embedder owns the implementation, which is what lets a host component reach
// libraries this package must not depend on.
export type FrontComponentHostImplementationPropsByTag = {
  'twenty-rich-text-editor': FrontComponentRichTextEditorImplementationProps;
};

export type FrontComponentHostImplementationTag =
  keyof FrontComponentHostImplementationPropsByTag;

export type FrontComponentHostImplementations = {
  [TTag in FrontComponentHostImplementationTag]?: ComponentType<
    FrontComponentHostImplementationPropsByTag[TTag]
  >;
};
