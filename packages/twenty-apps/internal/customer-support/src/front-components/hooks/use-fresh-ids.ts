import { useEffect, useRef, useState } from 'react';

const FRESH_HIGHLIGHT_MS = 2_400;

// Ids whose version changed since the previous render (a conversation that
// just got a message), so the row can glow for a moment. The first render
// marks nothing: a page load is not news.
export const useFreshIds = (
  items: { id: string; version: string | null }[],
): Set<string> => {
  const previousVersions = useRef<Map<string, string | null> | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const signature = items.map((item) => `${item.id}:${item.version}`).join('|');

  useEffect(() => {
    const currentVersions = new Map(
      items.map((item) => [item.id, item.version]),
    );
    const previous = previousVersions.current;

    previousVersions.current = currentVersions;

    if (previous === null) {
      return;
    }

    const changed = items
      .filter(
        (item) =>
          previous.has(item.id) && previous.get(item.id) !== item.version,
      )
      .map((item) => item.id);

    if (changed.length === 0) {
      return;
    }

    setFreshIds(new Set(changed));

    const timeout = setTimeout(
      () => setFreshIds(new Set()),
      FRESH_HIGHLIGHT_MS,
    );

    return () => clearTimeout(timeout);
    // `signature` stands for `items`: a new array with the same content must
    // not re-run the diff.
  }, [signature]);

  return freshIds;
};
