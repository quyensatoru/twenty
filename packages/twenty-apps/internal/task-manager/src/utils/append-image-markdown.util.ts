// Appends an uploaded image at the end of what the box holds now. The caret is
// not serialised onto a remote element, so an upload that lands while the
// author keeps typing cannot aim at the position the file was dropped at —
// the end of the current text is the only position that still means something.
export const appendImageMarkdown = (
  value: string,
  name: string,
  url: string,
): string => {
  const separator = value === '' || value.endsWith('\n') ? '' : '\n';

  return `${value}${separator}![${name}](${url})`;
};
