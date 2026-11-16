import 'react';

// Host-rendered overlay the fork's renderer provides: a dropdown written
// inline is clipped by the widget box, this one floats above the page and
// fires onClose on an outside click or Escape.
type OverlayAttributes = {
  offsetX?: number;
  offsetY?: number;
  onClose?: () => void;
  key?: string | number;
  children?: import('react').ReactNode;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'twenty-overlay': OverlayAttributes;
    }
  }
}
