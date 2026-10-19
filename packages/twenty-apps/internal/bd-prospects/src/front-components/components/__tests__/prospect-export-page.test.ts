// @vitest-environment jsdom

import { getByRole, getByText, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { read, utils } from 'xlsx-ugnis';

import { ProspectExportPage } from '../prospect-export-page';

const api = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query(query: unknown) {
      return api.query(query);
    }
  },
}));

vi.mock('twenty-sdk/front-component', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useColorScheme: () => 'light',
}));

let root: Root;
let container: HTMLDivElement;

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  api.query.mockReset();
  api.query.mockResolvedValue({
    prospects: {
      edges: [
        {
          node: {
            id: 'one',
            domain: 'shop.myshopify.com',
            email: null,
            linkedinPage: null,
            shopifyPlan: 'BASIC',
            ourApps: ['BLOY'],
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
      totalCount: 1,
    },
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(ProspectExportPage)));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const readCsvPreview = () => {
  const frame = container.querySelector('iframe')!;
  const html = new DOMParser().parseFromString(frame.srcdoc, 'text/html');
  const csv = html
    .querySelector('a')!
    .getAttribute('href')!
    .split('base64,')[1];
  const workbook = read(csv, { type: 'base64' });
  return utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    header: 1,
    defval: '',
  });
};

describe('ProspectExportPage', () => {
  it('adds filters when the sandbox has no randomUUID capability', async () => {
    vi.stubGlobal('crypto', {});
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Add filter' })),
    );
    expect(
      getByRole(container, 'combobox', { name: 'Filter 1 field' }),
    ).toBeDefined();
  });
  it('exports all prospects without selecting any records', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );

    expect(getByText(container, '1 store ready to export.')).toBeDefined();
    expect(readCsvPreview()).toEqual([
      ['Store domain', 'Email', 'LinkedIn page', 'Shopify plan', 'Our app'],
      ['shop.myshopify.com', '', '', 'Basic', 'BLOY'],
    ]);
  });

  it('exports only the selected columns and clears stale downloads when columns change', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'checkbox', { name: 'Email' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );

    expect(readCsvPreview()[0]).toEqual([
      'Store domain',
      'LinkedIn page',
      'Shopify plan',
      'Our app',
    ]);
    await act(async () =>
      user.click(getByRole(container, 'checkbox', { name: 'Industry' })),
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('shows validation errors for unfinished filters instead of downloading all prospects', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Add filter' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );

    expect(getByRole(container, 'alert').textContent).toContain(
      'Complete every filter value',
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('shows a request failure without offering partial downloads', async () => {
    api.query.mockRejectedValueOnce(new Error('Connection lost'));
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );

    expect(getByRole(container, 'alert').textContent).toBe('Connection lost');
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('invalidates the result when the filter mode changes', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );
    await act(async () =>
      user.click(
        getByRole(container, 'combobox', { name: 'Match conditions' }),
      ),
    );
    await act(async () =>
      user.click(
        getByRole(container, 'option', { name: 'Any condition (OR)' }),
      ),
    );

    expect(queryByRole(container, 'status')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('searches available fields without dropping selected columns from the file', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.type(
        getByRole(container, 'textbox', { name: 'Search export fields' }),
        'Industry',
      ),
    );
    expect(
      getByRole(container, 'checkbox', { name: 'Industry' }),
    ).toBeDefined();
    expect(queryByRole(container, 'checkbox', { name: 'Email' })).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );
    expect(readCsvPreview()[0]).toEqual([
      'Store domain',
      'Email',
      'LinkedIn page',
      'Shopify plan',
      'Our app',
    ]);
  });

  it('reorders the actual exported columns using the order controls', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Move Email earlier' }),
      ),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Export' })),
    );
    expect(readCsvPreview()[0]).toEqual([
      'Email',
      'Store domain',
      'LinkedIn page',
      'Shopify plan',
      'Our app',
    ]);
  });
});
