import { describe, expect, it } from 'vitest';
import { createTaskAiBudget, requireTaskAiPath } from '../task-ai-budget.util';

describe('task AI repository boundaries', () => {
  it('rejects traversal and absolute paths before provider requests', () => {
    for (const path of [
      '../secret',
      '/etc/passwd',
      'src/../../secret',
      'a\\b',
    ]) {
      expect(() => requireTaskAiPath(path)).toThrow();
    }
    expect(requireTaskAiPath('src/index.ts')).toBe('src/index.ts');
  });
  it('rejects oversized files and enforces the aggregate byte ceiling', () => {
    const budget = createTaskAiBudget();
    expect(() => budget.consume('a', 'x'.repeat(102401))).toThrow();
    budget.consume('a', 'x'.repeat(102400));
    budget.consume('b', 'x'.repeat(102400));
    budget.consume('c', 'x'.repeat(102400));
    expect(() => budget.consume('d', 'x')).toThrow();
  });
  it('counts distinct files and UTF-8 bytes', () => {
    const budget = createTaskAiBudget();
    for (let index = 0; index < 30; index++) budget.consume(String(index), 'x');
    expect(() => budget.consume('31', 'x')).toThrow();
    expect(() =>
      createTaskAiBudget().consume('a', 'é'.repeat(51201)),
    ).toThrow();
  });
});
