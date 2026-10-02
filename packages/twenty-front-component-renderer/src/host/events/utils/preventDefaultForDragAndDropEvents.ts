import { isFunction, isObject, isString } from '@sniptt/guards';

const DRAG_AND_DROP_EVENT_TYPES = new Set(['dragover', 'drop']);

// A remote handler crosses the bridge asynchronously, so a guest can never
// cancel these in time and the browser would navigate away to the dropped
// file — and without a cancelled dragover the drop never fires at all.
// Registering the handler is the opt-in.
export const preventDefaultForDragAndDropEvents = (event: unknown): void => {
  if (!isObject(event)) {
    return;
  }

  const domEvent = event as Record<string, unknown>;

  if (
    !isString(domEvent.type) ||
    !DRAG_AND_DROP_EVENT_TYPES.has(domEvent.type)
  ) {
    return;
  }

  if (isFunction(domEvent.preventDefault)) {
    (domEvent.preventDefault as () => void).call(domEvent);
  }
};
