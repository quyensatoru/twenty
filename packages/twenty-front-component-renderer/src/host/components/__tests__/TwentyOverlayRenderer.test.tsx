import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { TwentyOverlayRenderer } from '@/host/components/TwentyOverlayRenderer';

describe('TwentyOverlayRenderer', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.ResizeObserver ??= class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const pressEscapeOn = (target: EventTarget) => {
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    target.dispatchEvent(event);

    return event;
  };

  it('closes on Escape and keeps the key from reaching anything else', () => {
    const onClose = jest.fn();
    const onContentKeyDown = jest.fn();

    act(() =>
      root.render(
        <TwentyOverlayRenderer onClose={onClose}>
          <button type="button" onKeyDown={onContentKeyDown}>
            Inside
          </button>
        </TwentyOverlayRenderer>,
      ),
    );

    const event = pressEscapeOn(document.querySelector('button') as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(onContentKeyDown).not.toHaveBeenCalled();
  });

  it('lets Escape through to its content when it has no onClose', () => {
    const onContentKeyDown = jest.fn();

    act(() =>
      root.render(
        <TwentyOverlayRenderer>
          <button type="button" onKeyDown={onContentKeyDown}>
            Inside
          </button>
        </TwentyOverlayRenderer>,
      ),
    );

    const event = pressEscapeOn(document.querySelector('button') as HTMLElement);

    expect(event.defaultPrevented).toBe(false);
    expect(onContentKeyDown).toHaveBeenCalledTimes(1);
  });
});
