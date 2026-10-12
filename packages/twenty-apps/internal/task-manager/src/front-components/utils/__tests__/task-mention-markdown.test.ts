import { describe, expect, it } from 'vitest';

import {
  buildTaskMentionMarkdown,
  stripTaskMentionMarkup,
} from '../task-mention-markdown.util';

describe('task mention links', () => {
  it('use a same-origin path, the only non-web link the rich text API accepts', () => {
    const markdown = buildTaskMentionMarkdown('member-1', 'Alice');
    expect(markdown).toBe('[@Alice](/task-mention/member-1)');
    const href = markdown.match(/\(([^)]*)\)/)![1];
    expect(new URL(href, 'https://probe.invalid').origin).toBe(
      'https://probe.invalid',
    );
  });
  it('strip both the current and the earlier fragment form', () => {
    expect(
      stripTaskMentionMarkup(
        'Hi [@Alice](/task-mention/a) and [@Bob](#task-mention-b)',
      ),
    ).toBe('Hi @Alice and @Bob');
  });
});
