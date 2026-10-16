import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { TASK_TOKENS } from './task-tokens';

type TaskSideColumnResizeHandleProps = {
  isResizing: boolean;
  onHoverStart: () => void;
  onResizeStart: (clientX: number) => void;
  onReset: () => void;
};

// A zero-width item between the issue and its properties, the grip straddling
// the column's border. Inside the side column it would scroll away with the
// properties.
export const TaskSideColumnResizeHandle = ({
  isResizing,
  onHoverStart,
  onResizeStart,
  onReset,
}: TaskSideColumnResizeHandleProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ flex: '0 0 0px', position: 'relative', zIndex: 2 }}>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t('Resize properties')}
        title={t('Drag to resize · Double-click to reset')}
        onMouseDown={(event) => onResizeStart(event.clientX)}
        onDoubleClick={onReset}
        onMouseEnter={() => {
          setIsHovered(true);
          onHoverStart();
        }}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          bottom: 0,
          cursor: 'col-resize',
          display: 'flex',
          justifyContent: 'center',
          left: -4,
          position: 'absolute',
          top: 0,
          userSelect: 'none',
          width: 8,
        }}
      >
        <span
          style={{
            background: isResizing
              ? TASK_TOKENS.accent
              : isHovered
                ? TASK_TOKENS.borderStrong
                : 'transparent',
            height: '100%',
            width: 2,
          }}
        />
      </div>
    </div>
  );
};
