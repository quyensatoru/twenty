import { type ManualRecipient } from '../../types/manual-recipient';

export type ManualRecipientLineError = {
  lineNumber: number;
  message: string;
};

export type ParsedManualRecipients = {
  recipients: ManualRecipient[];
  errors: ManualRecipientLineError[];
  duplicateCount: number;
};

const MAX_RECIPIENTS = 5000;

// Deliberately loose, same rule as the prospect CSV import: catches a
// mistyped cell, not a judge of what an address may contain.
const isPlausibleEmail = (value: string): boolean => {
  const parts = value.split('@');

  return (
    parts.length === 2 &&
    parts[0].length > 0 &&
    parts[1].includes('.') &&
    !parts[1].startsWith('.') &&
    !parts[1].endsWith('.') &&
    !value.includes(' ')
  );
};

// One address per line, typed by hand or pasted from a spreadsheet column, an
// address book export, or a file read client-side: "email" or
// "email, Display Name". Blank lines are skipped; everything else is
// reported against its line number so a bad row is easy to find and fix.
export const parseManualRecipients = (
  text: string,
): ParsedManualRecipients => {
  const lines = text.split(/\r\n|\r|\n/);
  const recipients: ManualRecipient[] = [];
  const errors: ManualRecipientLineError[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (line === '') {
      return;
    }

    if (recipients.length >= MAX_RECIPIENTS) {
      if (errors.length === 0 || !errors[errors.length - 1].message.startsWith('Too many')) {
        errors.push({
          lineNumber: index + 1,
          message: `Too many recipients (max ${MAX_RECIPIENTS}); the rest were ignored`,
        });
      }

      return;
    }

    const commaIndex = line.indexOf(',');
    const rawEmail = (commaIndex === -1 ? line : line.slice(0, commaIndex)).trim();
    const rawName = commaIndex === -1 ? '' : line.slice(commaIndex + 1).trim();
    const email = rawEmail.toLowerCase();

    if (!isPlausibleEmail(email)) {
      errors.push({ lineNumber: index + 1, message: `Invalid email: "${rawEmail}"` });

      return;
    }

    if (seen.has(email)) {
      duplicateCount += 1;

      return;
    }

    seen.add(email);
    recipients.push({ email, name: rawName === '' ? null : rawName });
  });

  return { recipients, errors, duplicateCount };
};

// The reverse direction, for editing an already-saved list back into text.
export const formatManualRecipients = (
  recipients: ManualRecipient[],
): string =>
  recipients
    .map(({ email, name }) => (name === null || name === '' ? email : `${email}, ${name}`))
    .join('\n');
