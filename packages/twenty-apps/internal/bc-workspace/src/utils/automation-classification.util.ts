export type MessageClassification = {
  isIssue: boolean;
  isHowTo: boolean;
  matchesIssueId: string | null;
  title: string;
  classification: string | null;
  appNames: string[];
  summary: string | null;
  confidence: number;
};

export const MIN_ISSUE_CONFIDENCE = 0.5;

const readJsonObject = (text: string): Record<string, unknown> | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end <= start) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));

    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

// Models drift from the envelope; anything that cannot be read as the agreed
// shape is treated as "no decision" instead of an error.
export const parseMessageClassification = (
  text: string,
  knownIssueIds: string[],
): MessageClassification | null => {
  const parsed = readJsonObject(text);

  if (parsed === null || typeof parsed.isIssue !== 'boolean') {
    return null;
  }

  const confidence = Number(parsed.confidence);
  const matchesIssueId = readText(parsed.matchesIssueId);

  return {
    isIssue: parsed.isIssue,
    isHowTo: parsed.isHowTo === true,
    matchesIssueId:
      matchesIssueId !== null && knownIssueIds.includes(matchesIssueId)
        ? matchesIssueId
        : null,
    title: readText(parsed.title) ?? 'Client issue',
    classification: readText(parsed.classification),
    appNames: Array.isArray(parsed.appNames)
      ? parsed.appNames.filter(
          (name): name is string => typeof name === 'string' && name.trim().length > 0,
        )
      : [],
    summary: readText(parsed.summary),
    confidence: Number.isFinite(confidence) ? Math.min(Math.max(confidence, 0), 1) : 0,
  };
};

export type ClassificationAction = 'APPEND' | 'OPEN' | 'IGNORE';

// A how-to question never opens an issue, whatever the model's other flags.
export const decideClassificationAction = (
  result: MessageClassification | null,
): ClassificationAction => {
  if (result === null) {
    return 'IGNORE';
  }

  if (result.matchesIssueId !== null) {
    return 'APPEND';
  }

  return result.isIssue && !result.isHowTo && result.confidence >= MIN_ISSUE_CONFIDENCE
    ? 'OPEN'
    : 'IGNORE';
};
