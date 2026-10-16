import { type CSSProperties, type ReactNode } from 'react';

import { useSideColumnResize } from '../hooks/use-side-column-resize';
import { TaskSideColumnResizeHandle } from './task-side-column-resize-handle';

type TaskResizableColumnsProps = {
  rowStyle: CSSProperties;
  mainColumn: ReactNode;
  sideColumn: ReactNode;
  readSideColumnStyle: (width: number | null) => CSSProperties;
  sideColumnWidth: number | null;
  onSideColumnWidthChange: (width: number | null) => void;
  isResizable: boolean;
};

// The issue and its properties side by side. Its own component so a drag only
// re-renders this row: both columns come in as elements made by the parent,
// which React leaves alone while only the side column's width changes.
export const TaskResizableColumns = ({
  rowStyle,
  mainColumn,
  sideColumn,
  readSideColumnStyle,
  sideColumnWidth,
  onSideColumnWidthChange,
  isResizable,
}: TaskResizableColumnsProps) => {
  const resize = useSideColumnResize({
    sideColumnWidth,
    onSideColumnWidthChange,
  });

  return (
    <div
      onMouseMove={(event) => resize.updateResize(event.clientX)}
      onMouseUp={(event) => resize.endResize(event.clientX)}
      onMouseLeave={(event) => resize.endResize(event.clientX)}
      style={{
        ...rowStyle,
        // Held while dragging, so passing over the issue neither selects its
        // text nor drops the resize cursor.
        ...(resize.isResizing
          ? { cursor: 'col-resize', userSelect: 'none' }
          : {}),
      }}
    >
      {mainColumn}
      {isResizable && (
        <TaskSideColumnResizeHandle
          isResizing={resize.isResizing}
          onHoverStart={resize.measureSideColumn}
          onResizeStart={resize.startResize}
          onReset={resize.resetWidth}
        />
      )}
      <aside
        ref={resize.sideColumnRef}
        style={readSideColumnStyle(resize.displayedWidth)}
      >
        {sideColumn}
      </aside>
    </div>
  );
};
