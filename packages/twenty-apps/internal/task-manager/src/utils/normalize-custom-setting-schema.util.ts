import {
  type CustomSettingFieldSchemaEntry,
  type CustomSettingFieldType,
  type CustomSettingSchema,
  type CustomSettingToolSchemaEntry,
} from '../types/custom-setting-schema';

const FIELD_TYPE_BY_ALIAS: Record<string, CustomSettingFieldType> = {
  TEXT: 'TEXT',
  STRING: 'TEXT',
  BOOLEAN: 'BOOLEAN',
  BOOL: 'BOOLEAN',
  NUMBER: 'NUMBER',
  INTEGER: 'NUMBER',
  FLOAT: 'NUMBER',
  DATE: 'DATE',
  DATETIME: 'DATE',
  ARRAY: 'ARRAY',
  LIST: 'ARRAY',
  RICH_TEXT: 'RICH_TEXT',
  RICHTEXT: 'RICH_TEXT',
  TEXTAREA: 'RICH_TEXT',
  SELECT: 'SELECT',
  ENUM: 'SELECT',
  FILE: 'FILE',
};

const TOOL_TYPE = 'TOOL';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readDeclaredType = (type: unknown): string =>
  typeof type === 'string' ? type.trim().toUpperCase() : '';

const readOptions = (options: unknown): string[] | undefined => {
  if (!Array.isArray(options)) {
    return undefined;
  }

  const values = options
    .filter((option) => typeof option === 'string' || typeof option === 'number')
    .map((option) => String(option));

  return values.length > 0 ? values : undefined;
};

const readLabel = (source: Record<string, unknown>, key: string): string =>
  typeof source.label === 'string' && source.label.trim().length > 0
    ? source.label
    : key;

const readField = (
  key: string,
  descriptor: unknown,
): CustomSettingFieldSchemaEntry | null => {
  if (key.trim().length === 0) {
    return null;
  }

  // A descriptor written as a bare type name — `{ "plan": "string" }` — says
  // everything the long form says except the label.
  const source = isPlainObject(descriptor) ? descriptor : { type: descriptor };

  const options = readOptions(source.options);
  const declaredType = FIELD_TYPE_BY_ALIAS[readDeclaredType(source.type)] ?? 'TEXT';
  // A SELECT with no options renders a list the user cannot pick anything out
  // of, so it degrades to free text rather than to a dead control.
  const type =
    declaredType === 'SELECT' && options === undefined ? 'TEXT' : declaredType;

  const entry: CustomSettingFieldSchemaEntry = {
    key,
    label: readLabel(source, key),
    type,
  };

  if (options !== undefined) {
    entry.options = options;
  }

  if (source.default !== undefined) {
    entry.default = source.default;
  }

  if (source.required === true) {
    entry.required = true;
  }

  return entry;
};

const readTool = (
  key: string,
  source: Record<string, unknown>,
): CustomSettingToolSchemaEntry | null => {
  if (key.trim().length === 0) {
    return null;
  }

  const fields = Array.isArray(source.fields)
    ? source.fields
        .map((field) =>
          isPlainObject(field) && typeof field.key === 'string'
            ? readField(field.key, field)
            : null,
        )
        .filter((field): field is CustomSettingFieldSchemaEntry => field !== null)
    : [];

  return { key, label: readLabel(source, key), fields };
};

// app.fieldSchema is raw JSON an admin types by hand, so both shapes seen in
// the wild are accepted: the fork's array of entries, and the map of key to
// descriptor the seeded apps carry. Anything unreadable is dropped rather than
// thrown on — a typo in one entry must not cost the user the whole form.
//
// A TOOL entry is NEVER treated as a field. Its stored value is a run envelope,
// so folding it into the settings form would show the envelope as text and
// overwrite it on the next save.
export const normalizeCustomSettingSchema = (
  fieldSchema: unknown,
): CustomSettingSchema => {
  const descriptorsByKey: [string, unknown][] = Array.isArray(fieldSchema)
    ? fieldSchema
        .filter(
          (entry): entry is Record<string, unknown> =>
            isPlainObject(entry) && typeof entry.key === 'string',
        )
        .map((entry) => [entry.key as string, entry])
    : isPlainObject(fieldSchema)
      ? Object.entries(fieldSchema)
      : [];

  const schema: CustomSettingSchema = { fields: [], tools: [] };

  for (const [key, descriptor] of descriptorsByKey) {
    if (
      isPlainObject(descriptor) &&
      readDeclaredType(descriptor.type) === TOOL_TYPE
    ) {
      const tool = readTool(key, descriptor);

      if (tool !== null) {
        schema.tools.push(tool);
      }

      continue;
    }

    const field = readField(key, descriptor);

    if (field !== null) {
      schema.fields.push(field);
    }
  }

  return schema;
};
