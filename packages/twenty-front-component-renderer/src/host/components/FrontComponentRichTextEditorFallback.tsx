import { useTheme } from 'twenty-ui/theme';

import { type FrontComponentRichTextEditorImplementationProps as FrontComponentRichTextEditorFallbackProps } from '@/host/component-implementations/types/FrontComponentRichTextEditorImplementationProps';

// What an embedder that injected no rich text editor gets: plain text editing,
// no formatting. Degraded on purpose, so a missing implementation is visible
// rather than silently breaking the front component.
export const FrontComponentRichTextEditorFallback = ({
  value,
  placeholder,
  isReadOnly,
  onChange,
  onFocus,
  onBlur,
}: FrontComponentRichTextEditorFallbackProps) => {
  const theme = useTheme();

  return (
    <textarea
      value={value}
      placeholder={placeholder}
      readOnly={isReadOnly}
      onChange={(event) => onChange(event.target.value)}
      onFocus={() => onFocus()}
      onBlur={() => onBlur()}
      style={{
        backgroundColor: theme.background.primary,
        border: `1px solid ${theme.border.color.medium}`,
        borderRadius: theme.border.radius.sm,
        boxSizing: 'border-box',
        color: theme.font.color.primary,
        fontFamily: theme.font.family,
        fontSize: theme.font.size.md,
        height: '100%',
        padding: theme.spacing[2],
        resize: 'none',
        width: '100%',
      }}
    />
  );
};
