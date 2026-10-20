import { describe, expect, it } from 'vitest';

import { getChatMentionQuery, insertChatMention } from '../chat-mentions.util';

describe('chat mentions', () => {
  it('finds a mention being typed at the end of a message', () => {
    expect(getChatMentionQuery('Chúc mừng @Lan')).toBe('Lan');
    expect(getChatMentionQuery('@')).toBe('');
    expect(getChatMentionQuery('Gửi tim@company.vn')).toBeNull();
    expect(getChatMentionQuery('Chào @Lan Anh')).toBe('Lan Anh');
    expect(getChatMentionQuery('Chào @Lan\nnhé')).toBeNull();
  });

  it('inserts a member or everyone without losing the preceding message', () => {
    expect(insertChatMention('Chúc mừng @la', 'Lan Anh')).toBe('Chúc mừng @Lan Anh ');
    expect(insertChatMention('@all', 'mọi người')).toBe('@mọi người ');
  });
});
