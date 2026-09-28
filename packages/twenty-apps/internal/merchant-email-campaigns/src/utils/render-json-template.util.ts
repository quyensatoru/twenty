const EXACT_TOKEN_PATTERN = /^\{\{\s*([\w.]+)\s*\}\}$/;
const TOKEN_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

// Builds a request body from a JSON template. A string that is exactly one
// token is replaced by the raw value, or by null when the value is empty, so
// `"replyToAddress": "{{replyTo}}"` sends null rather than "". Tokens inside a
// longer string are interpolated as text. Values are never spliced into the
// JSON source, so HTML and quotes in the email cannot break the body.
export const renderJsonTemplate = (
  template: unknown,
  values: Record<string, string | undefined>,
): unknown => {
  if (typeof template === 'string') {
    const exactToken = template.match(EXACT_TOKEN_PATTERN);

    if (exactToken !== null) {
      const value = values[exactToken[1]];

      return value === undefined || value === '' ? null : value;
    }

    return template.replace(
      TOKEN_PATTERN,
      (_match, key: string) => values[key] ?? '',
    );
  }

  if (Array.isArray(template)) {
    return template.map((item) => renderJsonTemplate(item, values));
  }

  if (typeof template === 'object' && template !== null) {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [
        key,
        renderJsonTemplate(value, values),
      ]),
    );
  }

  return template;
};
