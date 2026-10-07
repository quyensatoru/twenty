import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';

import { FRONT_COMPONENT_OVERLAY_Z_INDEX } from '@/constants/FrontComponentOverlayZIndex';
import { type SerializedEventData } from '@/types/SerializedEventData';

const VIEWPORT_PADDING = 8;

type TwentyOverlayRendererProps = {
  offsetX?: number;
  offsetY?: number;
  children?: React.ReactNode;
  onClose?: (eventData: SerializedEventData) => void;
};

type OverlayPosition = { left: number; top: number };

// A dropdown a front component opens cannot live inside the front component.
// The widget it is rendered in clips its content, the grid item it sits in is
// a stacking context other widgets paint over, and a click that lands outside
// the component never reaches the guest at all, so the dropdown could not even
// learn it should close.
//
// So the host renders it: the children are portalled to the body, positioned
// against the element the overlay was written inside, and dismissed here, where
// the whole document is visible.
export const TwentyOverlayRenderer = ({
  offsetX,
  offsetY,
  children,
  onClose,
}: TwentyOverlayRendererProps) => {
  const anchorMarkerRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<OverlayPosition | null>(null);

  // oxlint-disable-next-line twenty/no-state-useref
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    // The marker is `display: none`, so it never takes part in layout while
    // still naming the element the guest wrote the overlay inside.
    const anchor = anchorMarkerRef.current?.parentElement;

    if (!isDefined(overlay) || !isDefined(anchor)) {
      return;
    }

    const reposition = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();

      const left = Math.min(
        Math.max(anchorRect.left + (offsetX ?? 0), VIEWPORT_PADDING),
        window.innerWidth - overlayRect.width - VIEWPORT_PADDING,
      );

      const preferredTop = anchorRect.top + (offsetY ?? 0);
      const overflowsBottom =
        preferredTop + overlayRect.height >
        window.innerHeight - VIEWPORT_PADDING;
      // Opening upward measures from the anchor's other edge, so the overlay
      // keeps the same gap to the row it belongs to.
      const top = overflowsBottom
        ? Math.max(
            anchorRect.bottom - (offsetY ?? 0) - overlayRect.height,
            VIEWPORT_PADDING,
          )
        : preferredTop;

      setPosition({ left, top });
    };

    reposition();

    // Observing fires once on connect, which is what places the overlay after
    // its children have their size, and again whenever the content grows (a
    // list filtering down) or the anchor moves.
    const resizeObserver = new ResizeObserver(reposition);
    resizeObserver.observe(overlay);
    resizeObserver.observe(anchor);

    // Capture: the scroller is some ancestor, not the window.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [offsetX, offsetY]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const overlay = overlayRef.current;
      // Clicks on whatever opened the overlay belong to the guest: it owns the
      // toggle, and closing here as well would reopen and close in one click.
      const anchor = anchorMarkerRef.current?.parentElement;

      if (
        overlay?.contains(target) === true ||
        anchor?.contains(target) === true
      ) {
        return;
      }

      onCloseRef.current?.({ type: 'close' });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // An overlay the guest dismisses itself (a modal handling its own keys)
      // must let Escape through, or the guest never sees it.
      if (event.key !== 'Escape' || !isDefined(onCloseRef.current)) {
        return;
      }

      // Escape dismisses this overlay and nothing behind it, the way it would
      // for one of the embedder's own dropdowns.
      event.stopPropagation();
      event.preventDefault();
      onCloseRef.current?.({ type: 'close' });
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <>
      <span ref={anchorMarkerRef} style={{ display: 'none' }} aria-hidden />
      {createPortal(
        <div
          ref={overlayRef}
          style={{
            left: position?.left ?? 0,
            maxHeight: `calc(100vh - ${VIEWPORT_PADDING * 2}px)`,
            maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
            position: 'fixed',
            top: position?.top ?? 0,
            // Measured before it is placed: showing it at 0,0 first would read
            // as the overlay jumping across the screen.
            visibility: isDefined(position) ? 'visible' : 'hidden',
            zIndex: FRONT_COMPONENT_OVERLAY_Z_INDEX,
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
};
