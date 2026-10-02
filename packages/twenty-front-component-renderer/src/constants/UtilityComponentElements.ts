import { type PropertySchema } from '@/types/PropertySchema';

// Elements that have no HTML counterpart: the host owns their DOM entirely and
// the guest only pushes properties and receives events. This is how a front
// component reaches capabilities the worker's stub DOM cannot provide.
type UtilityComponentElement = {
  tag: string;
  name: string;
  properties: Record<string, PropertySchema>;
  events: string[];
  hostRendererName: string;
  hostRendererPath: string;
  // Internal plumbing tags stay out of the app-facing JSX tag map so that only
  // elements meant for app authors can be written in a front component.
  isExposedToFrontComponentJsx: boolean;
};

export const UTILITY_COMPONENT_ELEMENTS: UtilityComponentElement[] = [
  {
    tag: 'remote-style',
    name: 'RemoteStyle',
    properties: {
      cssText: { type: 'string', optional: true },
      styleKey: { type: 'string', optional: true },
    },
    events: [],
    hostRendererName: 'RemoteStyleRenderer',
    hostRendererPath: '@/host/components/RemoteStyleRenderer',
    isExposedToFrontComponentJsx: false,
  },
  {
    tag: 'twenty-rich-text-editor',
    name: 'TwentyRichTextEditor',
    properties: {
      value: { type: 'string', optional: true },
      placeholder: { type: 'string', optional: true },
      isReadOnly: { type: 'boolean', optional: true },
      // The guest's answers to the `upload` events it was sent. Kept as a list
      // rather than one answer at a time because several files can be handed
      // over at once and they come back in whatever order they upload in.
      resolvedUploads: {
        type: 'array',
        itemType: '{ handle: string; url: string | null }',
        optional: true,
      },
    },
    // `upload` is how the editor reaches a file store without having one: it
    // hands the guest a handle for a file the user dropped in and waits for the
    // guest to answer with a URL. The guest is the only side that may upload —
    // it carries the application's own credentials and scope, the host carries
    // the signed-in user's.
    events: ['change', 'blur', 'upload'],
    hostRendererName: 'TwentyRichTextEditorRenderer',
    hostRendererPath: '@/host/components/TwentyRichTextEditorRenderer',
    isExposedToFrontComponentJsx: true,
  },
  {
    tag: 'twenty-overlay',
    name: 'TwentyOverlay',
    properties: {
      offsetX: { type: 'number', optional: true },
      offsetY: { type: 'number', optional: true },
    },
    // The guest cannot notice a click that lands outside its own tree: the
    // bridge only forwards events that hit an element it rendered. `close` is
    // the host telling it the user dismissed the overlay.
    events: ['close'],
    hostRendererName: 'TwentyOverlayRenderer',
    hostRendererPath: '@/host/components/TwentyOverlayRenderer',
    isExposedToFrontComponentJsx: true,
  },
];
