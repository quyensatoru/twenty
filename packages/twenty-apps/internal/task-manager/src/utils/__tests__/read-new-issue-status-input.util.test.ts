import { describe, expect, it } from 'vitest';

import { readNewIssueStatusInput } from '../read-new-issue-status-input.util';

describe('readNewIssueStatusInput', () => {
  it('trims the name and keeps the chosen category', () => {
    expect(
      readNewIssueStatusInput({ name: '  QA  ', category: 'STARTED' }),
    ).toEqual({ name: 'QA', category: 'STARTED', color: 'PURPLE' });
  });

  it('colours a status after its category', () => {
    expect(
      readNewIssueStatusInput({ name: 'Backlog', category: 'UNSTARTED' })
        .color,
    ).toBe('GRAY');
    expect(
      readNewIssueStatusInput({ name: 'Shipped', category: 'DONE' }).color,
    ).toBe('GREEN');
  });

  it('keeps an explicit colour from the palette', () => {
    expect(
      readNewIssueStatusInput({
        name: 'Blocked',
        category: 'STARTED',
        color: 'RED',
      }).color,
    ).toBe('RED');
  });

  it('refuses a blank name', () => {
    expect(() =>
      readNewIssueStatusInput({ name: '   ', category: 'STARTED' }),
    ).toThrow('name is required.');
    expect(() => readNewIssueStatusInput({ category: 'STARTED' })).toThrow(
      'name is required.',
    );
  });

  it('refuses an unknown or missing category', () => {
    expect(() =>
      readNewIssueStatusInput({ name: 'QA', category: 'LATER' }),
    ).toThrow('category must be one of UNSTARTED, STARTED, DONE.');
    expect(() => readNewIssueStatusInput({ name: 'QA' })).toThrow(
      'category must be one of UNSTARTED, STARTED, DONE.',
    );
  });

  it('refuses a colour outside the palette', () => {
    expect(() =>
      readNewIssueStatusInput({
        name: 'QA',
        category: 'STARTED',
        color: 'BEIGE',
      }),
    ).toThrow('color is not a status colour.');
  });
});
