export type MarkdownLinkUrlReplacement = {
  value: string;
  caretPosition: number;
};

// Swaps the target of an already-inserted markdown link once its file finishes
// uploading. The author keeps typing while that happens, so the replacement is
// located by its `](url)` shape in whatever the text has become rather than by
// the offset it was inserted at. A miss means the link is gone — the caller
// leaves the text alone.
export const replaceMarkdownLinkUrl = (
  value: string,
  sourceUrl: string,
  nextUrl: string,
): MarkdownLinkUrlReplacement | null => {
  const target = `](${sourceUrl})`;
  const targetIndex = value.indexOf(target);

  if (targetIndex === -1) {
    return null;
  }

  const replacement = `](${nextUrl})`;

  return {
    value:
      value.slice(0, targetIndex) +
      replacement +
      value.slice(targetIndex + target.length),
    caretPosition: targetIndex + replacement.length,
  };
};
