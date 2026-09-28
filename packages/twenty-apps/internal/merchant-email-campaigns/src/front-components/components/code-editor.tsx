import { t } from 'twenty-sdk/front-component';
import { useStableFieldValue } from '../hooks/use-stable-field-value';
import { STUDIO_TOKENS } from './studio-tokens';

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

// A plain textarea styled as code. The sandboxed renderer exposes no caret or
// key interception, so there is no syntax highlighting or tab-to-indent;
// `white-space: pre` keeps long lines unwrapped like a code editor.
export const CodeEditor = ({
  value,
  onChange,
  placeholder,
  rows = 24,
}: CodeEditorProps) => {
  const lineCount = value === '' ? 0 : value.split('\n').length;
  const { fieldValue, fieldKey, report } = useStableFieldValue(value);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}
    >
      <textarea
        key={fieldKey}
        value={fieldValue}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => {
          report(event.target.value);
          onChange(event.target.value);
        }}
        style={{
          background: STUDIO_TOKENS.backgroundTertiary,
          border: `1px solid ${STUDIO_TOKENS.border}`,
          borderRadius: STUDIO_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          color: STUDIO_TOKENS.textPrimary,
          fontFamily:
            'var(--t-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)',
          fontSize: 12,
          lineHeight: 1.55,
          minHeight: 320,
          overflow: 'auto',
          padding: 12,
          resize: 'vertical',
          tabSize: 2,
          whiteSpace: 'pre',
          width: '100%',
        }}
      />
      <span
        style={{
          color: STUDIO_TOKENS.textTertiary,
          fontSize: 11,
          textAlign: 'right',
        }}
      >
        {t('{lines} lines · {characters} characters', {
          lines: lineCount,
          characters: value.length.toLocaleString(),
        })}
      </span>
    </div>
  );
};
