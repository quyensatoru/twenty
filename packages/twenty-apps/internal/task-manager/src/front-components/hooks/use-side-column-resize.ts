import { useRef, useState } from 'react';

import {
  clampSideColumnWidth,
  parseSideColumnWidth,
} from '../utils/side-column-width.util';

const SIDE_COLUMN_WIDTH_STORAGE_KEY = 'task-detail.side-column-width';

// The sandbox's localStorage is seeded from the host before the first render,
// so this reads synchronously. Guarded anyway: a missing or full store must
// never take the issue down with it.
export const readStoredSideColumnWidth = (): number | null => {
  try {
    return parseSideColumnWidth(
      localStorage.getItem(SIDE_COLUMN_WIDTH_STORAGE_KEY),
    );
  } catch {
    return null;
  }
};

const storeSideColumnWidth = (width: number | null) => {
  try {
    if (width === null) {
      localStorage.removeItem(SIDE_COLUMN_WIDTH_STORAGE_KEY);
    } else {
      localStorage.setItem(SIDE_COLUMN_WIDTH_STORAGE_KEY, String(width));
    }
  } catch {
    // The width is a convenience: losing it only costs the reader a drag.
  }
};

// The width the reader settled on, one for the modal and the record page.
export const useStoredSideColumnWidth = () => {
  const [sideColumnWidth, setSideColumnWidth] = useState<number | null>(
    readStoredSideColumnWidth,
  );

  const changeSideColumnWidth = (width: number | null) => {
    setSideColumnWidth(width);
    storeSideColumnWidth(width);
  };

  return { sideColumnWidth, changeSideColumnWidth };
};

type SideColumnResize = {
  startX: number;
  // Null until the column's width has been read, see measureSideColumn.
  startWidth: number | null;
};

// No window listener reaches the sandbox, so the drag follows the pointer
// through the two columns' row, and ends when the button comes up there or
// the pointer leaves it. The width in flight stays here and only the settled
// one goes back up: every move re-rendering the whole issue made it lag.
export const useSideColumnResize = ({
  sideColumnWidth,
  onSideColumnWidthChange,
}: {
  sideColumnWidth: number | null;
  onSideColumnWidthChange: (width: number | null) => void;
}) => {
  const [resize, setResize] = useState<SideColumnResize | null>(null);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);
  const sideColumnRef = useRef<HTMLElement>(null);

  // Measured rather than the stored width, which the layout's caps can show
  // narrower. The sandbox answers an element's first geometry read with 0
  // while it fetches the snapshot, so hovering the handle reads it ahead of
  // the press, and a width still unknown then is read again on the first move.
  const measureSideColumn = (): number | null => {
    const width = sideColumnRef.current?.getBoundingClientRect().width ?? 0;

    return width > 0 ? width : null;
  };

  // The column sits on the right, so pulling its edge left widens it.
  const readResizedWidth = (
    startWidth: number,
    startX: number,
    clientX: number,
  ) => clampSideColumnWidth(startWidth - (clientX - startX));

  const startResize = (clientX: number) => {
    setResize({ startX: clientX, startWidth: measureSideColumn() });
  };

  const updateResize = (clientX: number) => {
    if (resize === null) {
      return;
    }

    if (resize.startWidth === null) {
      const startWidth = measureSideColumn();

      if (startWidth !== null) {
        setResize({ ...resize, startWidth });
      }

      return;
    }

    setDraggedWidth(
      readResizedWidth(resize.startWidth, resize.startX, clientX),
    );
  };

  const endResize = (clientX: number) => {
    if (resize === null) {
      return;
    }

    setResize(null);
    setDraggedWidth(null);

    if (resize.startWidth !== null) {
      onSideColumnWidthChange(
        readResizedWidth(resize.startWidth, resize.startX, clientX),
      );
    }
  };

  const resetWidth = () => {
    setResize(null);
    setDraggedWidth(null);
    onSideColumnWidthChange(null);
  };

  return {
    displayedWidth: draggedWidth ?? sideColumnWidth,
    sideColumnRef,
    isResizing: resize !== null,
    measureSideColumn,
    startResize,
    updateResize,
    endResize,
    resetWidth,
  };
};
