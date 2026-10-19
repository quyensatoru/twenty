// @vitest-environment jsdom

import { getByRole, getByText, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProspectImportPage } from '../prospect-import-page';

const api = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  clipboard: vi.fn(),
  snackbar: vi.fn(),
}));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: class {
    query(request: unknown) {
      return api.query(request);
    }
    mutation(request: unknown) {
      return api.mutation(request);
    }
  },
}));
vi.mock('twenty-sdk/front-component', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  copyToClipboard: api.clipboard,
  enqueueSnackbar: api.snackbar,
}));

let root: Root;
let container: HTMLDivElement;
const CSV =
  'domain,shopName,email,shopifyPlan,app,industry\nshop.myshopify.com,Example,owner@shop.com,PLUS,MIDA,Fashion';

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  api.query.mockReset().mockResolvedValue({ prospects: { edges: [] } });
  api.mutation.mockReset().mockResolvedValue({});
  api.clipboard.mockReset().mockResolvedValue(undefined);
  api.snackbar.mockReset().mockResolvedValue(undefined);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(createElement(ProspectImportPage)));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const reviewCsv = async () => {
  const user = userEvent.setup();
  await act(async () =>
    user.type(getByRole(container, 'textbox', { name: 'CSV contents' }), CSV),
  );
  await act(async () =>
    user.click(getByRole(container, 'button', { name: 'Check rows' })),
  );
  return user;
};

describe('ProspectImportPage', () => {
  it('keeps CSV guidance optional and opens it on request', async () => {
    expect(
      queryByRole(container, 'heading', { name: 'CSV columns' }),
    ).toBeNull();
    const user = userEvent.setup();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'CSV format' })),
    );
    expect(
      getByRole(container, 'heading', { name: 'CSV columns' }),
    ).toBeDefined();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Hide CSV format' })),
    );
    expect(
      queryByRole(container, 'heading', { name: 'CSV columns' }),
    ).toBeNull();
  });

  it('focuses review on results and preserves the CSV when returning to edit', async () => {
    const user = await reviewCsv();
    expect(
      queryByRole(container, 'textbox', { name: 'CSV contents' }),
    ).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Edit CSV' })),
    );
    expect(
      (
        getByRole(container, 'textbox', {
          name: 'CSV contents',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe(CSV);
    expect(api.mutation).not.toHaveBeenCalled();
  });

  it('previews store data and requires confirmation before importing', async () => {
    const user = await reviewCsv();
    expect(
      getByRole(container, 'cell', { name: 'shop.myshopify.com' }),
    ).toBeDefined();
    expect(getByRole(container, 'cell', { name: 'Create' })).toBeDefined();
    expect(api.mutation).not.toHaveBeenCalled();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Confirm import' })),
    );
    expect(getByText(container, 'Import complete')).toBeDefined();
  });

  it('discards stale previews when pasted CSV changes', async () => {
    const user = await reviewCsv();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Edit CSV' })),
    );
    await act(async () =>
      user.type(
        getByRole(container, 'textbox', { name: 'CSV contents' }),
        '\n',
      ),
    );
    expect(
      queryByRole(container, 'button', { name: 'Confirm import' }),
    ).toBeNull();
    expect(
      getByRole(container, 'button', { name: 'Check rows' }),
    ).toBeDefined();
  });

  it('shows an update when the store already exists', async () => {
    const { computeProspectId } = await import('../../../utils/prospect-id');
    api.query.mockResolvedValue({
      prospects: {
        edges: [
          {
            node: {
              id: computeProspectId('shop.myshopify.com'),
              ourApps: ['BLOY'],
              otherApps: [],
            },
          },
        ],
      },
    });
    await reviewCsv();
    expect(getByRole(container, 'cell', { name: 'Update' })).toBeDefined();
  });

  it('shows invalid rows and keeps confirmation disabled with no valid stores', async () => {
    const user = userEvent.setup();
    await act(async () =>
      user.type(
        getByRole(container, 'textbox', { name: 'CSV contents' }),
        'domain,app\nnot-a-domain,MIDA',
      ),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Check rows' })),
    );
    expect(
      (
        getByRole(container, 'button', {
          name: 'Confirm import',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(getByRole(container, 'alert')).toBeDefined();
  });

  it('offers a fresh import after completion', async () => {
    const user = await reviewCsv();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Confirm import' })),
    );
    await act(async () =>
      user.click(
        getByRole(container, 'button', { name: 'Import another CSV' }),
      ),
    );
    expect(
      (
        getByRole(container, 'textbox', {
          name: 'CSV contents',
        }) as HTMLTextAreaElement
      ).value,
    ).toBe('');
  });
});
