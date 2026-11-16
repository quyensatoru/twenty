export type OperatorCandidate = {
  memberId: string | null;
  name: string | null;
  crispOperatorNames: string[] | null;
  isActive: boolean;
};

export const normalizeOperatorName = (value: string | null | undefined): string =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

// A Crisp operator counts as a BC only when the name matches a configured
// alias or the BC's own name; everyone else is support, not BC contact.
export const matchBcOperator = (
  senderName: string | null | undefined,
  candidates: OperatorCandidate[],
): string | null => {
  const sender = normalizeOperatorName(senderName);

  if (sender.length === 0) {
    return null;
  }

  const match = candidates.find(
    (candidate) =>
      candidate.isActive &&
      candidate.memberId !== null &&
      [candidate.name, ...(candidate.crispOperatorNames ?? [])].some(
        (name) => normalizeOperatorName(name) === sender,
      ),
  );

  return match?.memberId ?? null;
};
