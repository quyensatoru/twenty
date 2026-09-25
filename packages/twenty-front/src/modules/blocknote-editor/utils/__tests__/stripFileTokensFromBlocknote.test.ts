import { stripFileTokensFromBlocknote } from '@/blocknote-editor/utils/stripFileTokensFromBlocknote';

const FILE_ID = '0b8a6b1c-2f4e-4d3a-9c1b-7e5f6a8d9c0b';

const buildBody = (imageUrl: string) =>
  JSON.stringify([
    { type: 'paragraph', content: 'Hello' },
    { type: 'image', props: { url: imageUrl, caption: '' } },
  ]);

describe('stripFileTokensFromBlocknote', () => {
  it('makes bodies signed with different tokens compare equal', () => {
    const firstRead = buildBody(
      `https://api.example.com/file/files-field/${FILE_ID}?token=first`,
    );
    const secondRead = buildBody(
      `https://api.example.com/file/files-field/${FILE_ID}?token=second`,
    );

    expect(stripFileTokensFromBlocknote(firstRead)).toBe(
      stripFileTokensFromBlocknote(secondRead),
    );
    expect(stripFileTokensFromBlocknote(firstRead)).toBe(
      buildBody(`https://api.example.com/file/files-field/${FILE_ID}`),
    );
  });

  it('keeps external image urls untouched', () => {
    const body = buildBody('https://images.example.com/cat.png?token=keep');

    expect(stripFileTokensFromBlocknote(body)).toBe(body);
  });

  it('returns bodies without file urls unchanged', () => {
    const body = JSON.stringify([{ type: 'paragraph', content: 'Hello' }]);

    expect(stripFileTokensFromBlocknote(body)).toBe(body);
  });

  it('handles empty values', () => {
    expect(stripFileTokensFromBlocknote(undefined)).toBe('');
    expect(stripFileTokensFromBlocknote(null)).toBe('');
    expect(stripFileTokensFromBlocknote('')).toBe('');
  });
});
