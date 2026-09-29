import {
  stashTransferredFile,
  takeTransferredFile,
} from '../transferredFileStash';

const buildFile = (name: string) => new File(['x'], name);

describe('transferredFileStash', () => {
  it('should return the stashed file for its handle', () => {
    const file = buildFile('a.png');

    expect(takeTransferredFile(stashTransferredFile(file))).toBe(file);
  });

  it('should hand out an unguessable handle per file', () => {
    const firstHandle = stashTransferredFile(buildFile('a.png'));
    const secondHandle = stashTransferredFile(buildFile('a.png'));

    expect(firstHandle).not.toBe(secondHandle);
    expect(firstHandle).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should spend a handle on the first take', () => {
    const handle = stashTransferredFile(buildFile('a.png'));

    expect(takeTransferredFile(handle)).toBeDefined();
    expect(takeTransferredFile(handle)).toBeUndefined();
  });

  it('should return nothing for an unknown handle', () => {
    expect(takeTransferredFile('not-a-handle')).toBeUndefined();
  });

  it('should evict the oldest entries once the cap is reached', () => {
    const handles = Array.from({ length: 9 }, (_unused, index) =>
      stashTransferredFile(buildFile(`${index}.png`)),
    );

    expect(takeTransferredFile(handles[0])).toBeUndefined();
    expect(takeTransferredFile(handles[8])).toBeDefined();
  });

  it('should evict an entry older than its lifetime', () => {
    const handle = stashTransferredFile(buildFile('a.png'));

    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000);

    expect(takeTransferredFile(handle)).toBeUndefined();

    jest.restoreAllMocks();
  });
});
