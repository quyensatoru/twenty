import { TASK_TOKENS } from './task-tokens';

// Shared with the record page's unified left column so both read as the same
// Jira-style sections rather than drifting apart one edit at a time.
export const SectionHeading = ({
  label,
  count,
}: {
  label: string;
  count?: number;
}) => (
  <h3
    style={{
      color: TASK_TOKENS.textTertiary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.4,
      margin: 0,
      textTransform: 'uppercase',
    }}
  >
    {label}
    {count !== undefined ? ` (${count})` : ''}
  </h3>
);
