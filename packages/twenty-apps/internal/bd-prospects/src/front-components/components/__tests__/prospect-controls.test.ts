// @vitest-environment jsdom

import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

import { ProspectSelect } from '../prospect-controls';

it.each([false, true])(
  'chooses once with keyboard activation (forwarded: %s)',
  async (isForwarded) => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const onChange = vi.fn();
    try {
      await act(async () =>
        root.render(
          createElement(ProspectSelect, {
            value: 'and',
            options: [
              { value: 'and', label: 'All conditions' },
              { value: 'or', label: 'Any condition' },
            ],
            onChange,
            ariaLabel: 'Match conditions',
          }),
        ),
      );
      const user = userEvent.setup();
      await act(async () =>
        user.click(
          getByRole(container, 'combobox', { name: 'Match conditions' }),
        ),
      );
      expect(getByRole(container, 'listbox')).toBeDefined();
      await act(async () => user.keyboard('{ArrowDown}'));
      if (isForwarded) {
        await act(async () => {
          fireEvent.keyDown(getByRole(container, 'combobox'), {
            key: 'Enter',
            cancelable: false,
          });
        });
        await act(async () => {
          fireEvent.click(getByRole(container, 'combobox'), { detail: 0 });
        });
      } else {
        await act(async () => user.keyboard('{Enter}'));
      }
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('or');
      expect(queryByRole(container, 'listbox')).toBeNull();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  },
);
