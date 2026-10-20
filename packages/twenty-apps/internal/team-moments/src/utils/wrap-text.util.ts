// Greedy word wrap by character count. SVG has no text layout, and the card
// fonts are proportional, so the limit is set a little under the real width.
export const wrapText = (text: string, maxCharacters: number, maxLines: number): string[] => {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    let line = '';

    for (const word of paragraph.split(/\s+/).filter((part) => part.length > 0)) {
      const candidate = line.length === 0 ? word : `${line} ${word}`;

      if (candidate.length > maxCharacters && line.length > 0) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    lines.push(line);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const kept = lines.slice(0, maxLines);

  kept[maxLines - 1] = `${kept[maxLines - 1]}…`;

  return kept;
};
