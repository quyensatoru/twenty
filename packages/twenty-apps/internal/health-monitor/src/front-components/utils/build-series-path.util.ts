// Paths live in a viewBox of `0 0 (count - 1) 100`, stretched to the chart's
// box. A null bucket breaks the line, so a gap in polling shows as a gap.
export const buildSeriesPath = (
  values: (number | null)[],
  maxValue: number,
): { line: string; area: string } => {
  const y = (value: number) =>
    (100 - (Math.min(value, maxValue) / maxValue) * 100).toFixed(2);
  const segments: { start: number; end: number; points: string[] }[] = [];
  let current: { start: number; end: number; points: string[] } | null = null;

  values.forEach((value, index) => {
    if (value === null) {
      current = null;

      return;
    }

    if (current === null) {
      current = { start: index, end: index, points: [] };
      segments.push(current);
    }

    current.points.push(`${index} ${y(value)}`);
    current.end = index;
  });

  // A lone bucket would be a zero-length path, so it is drawn as a short tick.
  const line = segments
    .map((segment) =>
      segment.points.length === 1
        ? `M${segment.start - 0.3} ${segment.points[0].split(' ')[1]} L${segment.start + 0.3} ${segment.points[0].split(' ')[1]}`
        : `M${segment.points.join(' L')}`,
    )
    .join(' ');
  const area = segments
    .map(
      (segment) =>
        `M${segment.start} 100 L${segment.points.join(' L')} L${segment.end} 100 Z`,
    )
    .join(' ');

  return { line, area };
};

export const bucketTime = (
  startAt: string,
  bucketMinutes: number,
  index: number,
): string =>
  new Date(
    Date.parse(startAt) + (index + 0.5) * bucketMinutes * 60_000,
  ).toISOString();
