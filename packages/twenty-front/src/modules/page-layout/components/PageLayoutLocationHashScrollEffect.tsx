import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isNonEmptyString } from '@sniptt/guards';

// How long to keep waiting for the element a fragment names. Widget content
// arrives over the network and a front component's content arrives over a
// worker on top of that, so the target is never in the document on the first
// pass; past this the link is treated as pointing at something that is not
// here, and the reader is left where they are.
const TARGET_WAIT_TIMEOUT_MS = 10000;

// Scrolls to whatever the URL fragment names, once it exists.
//
// The browser only does this for elements present at load. Everything inside a
// page layout mounts later — and a front component's rows later still, since
// its id reaches the real DOM only after the worker has rendered — so the
// native behaviour never fires for them and the fragment is inert.
//
// It deliberately knows nothing about who owns the fragment: an app that gives
// a row a stable id gets a working deep link out of it, with no host change of
// its own.
// oxlint-disable-next-line twenty/effect-components
export const PageLayoutLocationHashScrollEffect = () => {
  const { hash } = useLocation();

  // Scrolling happens once per fragment: content re-renders while it is read,
  // and a reader who has scrolled away must not be dragged back every time.
  // oxlint-disable-next-line twenty/no-state-useref
  const handledHashRef = useRef<string | null>(null);

  useEffect(() => {
    const targetId = decodeURIComponent(hash.replace(/^#/, ''));

    if (!isNonEmptyString(targetId) || handledHashRef.current === hash) {
      return;
    }

    const scrollToTargetIfPresent = (): boolean => {
      const target = document.getElementById(targetId);

      if (target === null) {
        return false;
      }

      handledHashRef.current = hash;
      target.scrollIntoView({ block: 'center' });

      return true;
    };

    if (scrollToTargetIfPresent()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (scrollToTargetIfPresent()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timeoutId = setTimeout(
      () => observer.disconnect(),
      TARGET_WAIT_TIMEOUT_MS,
    );

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [hash]);

  return null;
};
