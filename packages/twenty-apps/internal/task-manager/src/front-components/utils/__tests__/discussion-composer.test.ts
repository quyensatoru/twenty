// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('twenty-sdk/front-component', () => ({ t: (text: string) => text }));
vi.mock('../../components/task-rich-text-editor', () => ({
  TaskRichTextEditor: ({
    value,
    onChange,
    isReadOnly,
  }: {
    value: string;
    onChange: (value: string) => void;
    isReadOnly: boolean;
  }) =>
    createElement('textarea', {
      value,
      readOnly: isReadOnly,
      onChange: (event: { target: { value: string } }) =>
        onChange(event.target.value),
    }),
}));
import { DiscussionComposer } from '../../components/discussion-composer';
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('discussion composer', () => {
  it('keeps typing after a selected mention in the comment and opens a new mention only for another @', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [
            { id: 'alice', name: { firstName: 'Alice', lastName: 'Smith' } },
            { id: 'bob', name: { firstName: 'Bob' } },
          ],
          onCreate: create,
        }),
      ),
    );
    await act(async () => user.type(getByRole(container, 'textbox'), '@'));
    await act(async () =>
      user.click(getByRole(container, 'option', { name: 'Alice Smith' })),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'please check this'),
    );
    expect(queryByRole(container, 'listbox')).toBeNull();
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      '[@Alice Smith](/task-mention/alice) please check this',
    );
    await act(async () => user.type(getByRole(container, 'textbox'), ' @'));
    getByRole(container, 'listbox');
    await act(async () =>
      user.click(getByRole(container, 'option', { name: 'Bob' })),
    );
    await act(async () =>
      fireEvent.change(getByRole(container, 'textbox'), {
        target: {
          value:
            '[@Alice Smith](/task-mention/alice)\n\nplease check this [@Bob](/task-mention/bob) \n\n',
        },
      }),
    );
    expect(queryByRole(container, 'listbox')).toBeNull();
    await act(async () => user.type(getByRole(container, 'textbox'), ' too'));
    expect(queryByRole(container, 'listbox')).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(create.mock.calls[0][0]).toMatchObject({
      markdown:
        '[@Alice Smith](/task-mention/alice)\n\nplease check this [@Bob](/task-mention/bob) \n\n too',
      mentionMemberIds: ['alice', 'bob'],
    });
  });

  it('retains failed drafts and retries with the same request identifier', async () => {
    const user = userEvent.setup();
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(undefined);
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [],
          onCreate: create,
        }),
      ),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Ship release'),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      'Ship release',
    );
    expect(getByRole(container, 'status').textContent).toContain('Offline');
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Retry' })),
    );
    expect(create.mock.calls[1][0]).toEqual(create.mock.calls[0][0]);
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      '',
    );
    expect(getByRole(container, 'status').textContent).toBe('Sent');
  });
  it('offers scoped members and submits selected mention IDs', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [
            { id: 'alice', name: { firstName: 'Alice' } },
            { id: 'bob', name: { firstName: 'Bob' } },
          ],
          onCreate: create,
        }),
      ),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Hi @Ali'),
    );
    expect(queryByRole(container, 'option', { name: 'Bob' })).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'option', { name: 'Alice' })),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(create.mock.calls[0][0].mentionMemberIds).toEqual(['alice']);
    expect(create.mock.calls[0][0].markdown).toBe(
      'Hi [@Alice](/task-mention/alice)',
    );
  });
  it('recognizes a mention in markdown with trailing paragraph newlines', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [{ id: 'alice', name: { firstName: 'Alice' } }],
          onCreate: create,
        }),
      ),
    );
    await act(async () =>
      fireEvent.change(getByRole(container, 'textbox'), {
        target: { value: 'Hi @Ali\n\n' },
      }),
    );
    await act(async () =>
      user.click(getByRole(container, 'option', { name: 'Alice' })),
    );
    expect(queryByRole(container, 'listbox')).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(create.mock.calls[0][0]).toMatchObject({
      markdown: 'Hi [@Alice](/task-mention/alice)',
      mentionMemberIds: ['alice'],
    });
  });
  it('distinguishes namesakes by email and supports keyboard selection', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [
            {
              id: 'alice',
              name: { firstName: 'Alex' },
              userEmail: 'alex.one@example.com',
              avatarUrl: null,
            },
            {
              id: 'bob',
              name: { firstName: 'Alex' },
              userEmail: 'alex.two@example.com',
              avatarUrl: null,
            },
          ],
          onCreate: create,
        }),
      ),
    );
    await act(async () => user.type(getByRole(container, 'textbox'), 'Hi @'));
    const search = getByRole(container, 'combobox', { name: 'Search members' });
    expect(
      getByRole(container, 'option', {
        name: /Alex alex.one@example.com/,
      }).getAttribute('aria-selected'),
    ).toBe('true');
    await act(async () => user.keyboard('{ArrowDown}'));
    expect(
      getByRole(container, 'option', {
        name: /Alex alex.two@example.com/,
      }).getAttribute('aria-selected'),
    ).toBe('true');
    await act(async () => user.keyboard('{ArrowUp}'));
    expect(
      getByRole(container, 'option', {
        name: /Alex alex.one@example.com/,
      }).getAttribute('aria-selected'),
    ).toBe('true');
    await act(async () => user.type(search, 'two@example'));
    expect(queryByRole(container, 'option', { name: /alex.one/ })).toBeNull();
    await act(async () => user.keyboard('{Enter}'));
    expect(queryByRole(container, 'listbox')).toBeNull();
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(create.mock.calls[0][0]).toMatchObject({
      markdown: 'Hi [@Alex](/task-mention/bob)',
      mentionMemberIds: ['bob'],
    });
  });
  it('keeps the highlighted member visible in a longer list', async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(undefined);
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: Array.from({ length: 9 }, (_, index) => ({
            id: `member-${index}`,
            name: { firstName: `Member ${index}` },
            userEmail: `member${index}@example.com`,
          })),
          onCreate: create,
        }),
      ),
    );
    await act(async () => user.type(getByRole(container, 'textbox'), '@'));
    await act(async () =>
      user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}'),
    );
    expect(
      getByRole(container, 'option', {
        name: 'Member 5 member5@example.com',
      }).getAttribute('aria-selected'),
    ).toBe('true');
    await act(async () => user.keyboard('{Enter}'));
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(create.mock.calls[0][0].mentionMemberIds).toEqual(['member-5']);
  });
  it('closes suggestions on Escape without changing the draft', async () => {
    const user = userEvent.setup();
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [{ id: 'alice', name: { firstName: 'Alice' } }],
          onCreate: vi.fn(),
        }),
      ),
    );
    await act(async () => user.type(getByRole(container, 'textbox'), 'Hi @'));
    getByRole(container, 'combobox', { name: 'Search members' });
    await act(async () => user.keyboard('{Escape}'));
    expect(queryByRole(container, 'listbox')).toBeNull();
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      'Hi @',
    );
  });
  it('shows an optimistic pending message until the server confirms delivery', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const create = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await act(async () =>
      root.render(
        createElement(DiscussionComposer, {
          issueId: 'issue',
          members: [],
          onCreate: create,
        }),
      ),
    );
    await act(async () =>
      user.type(getByRole(container, 'textbox'), 'Release ready'),
    );
    await act(async () =>
      user.click(getByRole(container, 'button', { name: 'Comment' })),
    );
    expect(getByRole(container, 'status').textContent).toBe('Pending');
    expect((getByRole(container, 'textbox') as HTMLTextAreaElement).value).toBe(
      'Release ready',
    );
    await act(async () => finish());
    expect(getByRole(container, 'status').textContent).toBe('Sent');
  });
});
