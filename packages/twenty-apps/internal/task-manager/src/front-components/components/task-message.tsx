import { TASK_TOKENS } from './task-tokens';

type TaskMessageProps = {
  text: string;
  tone?: 'neutral' | 'danger';
};

export const TaskMessage = ({ text, tone = 'neutral' }: TaskMessageProps) => (
  <p
    style={{
      color:
        tone === 'danger' ? TASK_TOKENS.textDanger : TASK_TOKENS.textSecondary,
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      margin: 0,
      padding: 16,
    }}
  >
    {text}
  </p>
);
