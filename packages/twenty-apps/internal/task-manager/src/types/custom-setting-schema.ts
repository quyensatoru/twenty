// The schema driving a merchant's Custom Settings, authored as raw JSON on the
// merchant's app (app.fieldSchema). There is no schema-editing UI: an admin
// types the JSON on the App record, exactly as in the fork.
//
// Two kinds of entry live in the same array and must never be confused:
// plain fields are desired state, saved together; TOOL entries are run-once
// actions whose stored value is a run envelope, not a setting.
export type CustomSettingFieldType =
  | 'TEXT'
  | 'BOOLEAN'
  | 'NUMBER'
  | 'DATE'
  | 'ARRAY'
  | 'RICH_TEXT'
  | 'SELECT'
  | 'FILE';

export type CustomSettingFieldSchemaEntry = {
  key: string;
  label: string;
  type: CustomSettingFieldType;
  options?: string[];
  default?: unknown;
  required?: boolean;
};

export type CustomSettingToolSchemaEntry = {
  key: string;
  label: string;
  fields: CustomSettingFieldSchemaEntry[];
};

// Kept apart on purpose. Everything that writes to the record iterates
// `fields`, so a tool's envelope can never be flattened into a setting value.
export type CustomSettingSchema = {
  fields: CustomSettingFieldSchemaEntry[];
  tools: CustomSettingToolSchemaEntry[];
};

// Persisted shape of a FILE value: the bytes live in Twenty's file store, the
// record keeps a reference plus the URL minted at upload time.
export type CustomSettingFileValue = {
  fileId: string;
  label: string;
  extension: string;
  url: string;
};

// What an input holds while the form is open. Every type edits as a string
// except BOOLEAN and FILE, so form state stays flat and
// parseCustomSettingValue is the single place that turns it back into the
// stored shape.
export type CustomSettingDraftValue = string | boolean | CustomSettingFileValue;

export type CustomSettingToolRunStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

// Written under customSettings[toolKey] when a tool runs. The app behind the
// webhook deduplicates on runId and echoes the envelope back with a later
// status, which is why nothing in the settings form may ever overwrite it.
export type CustomSettingToolRun = {
  runId: string;
  requestedAt: string;
  requestedBy?: string;
  status: CustomSettingToolRunStatus;
  params: Record<string, unknown>;
  result?: {
    summary?: string;
    details?: Record<string, string | number | boolean>;
  };
};

export type CustomSettingValues = Record<string, unknown>;

export const isCustomSettingFileValue = (
  value: unknown,
): value is CustomSettingFileValue =>
  typeof value === 'object' &&
  value !== null &&
  'fileId' in (value as Record<string, unknown>);

export const isCustomSettingToolRun = (
  value: unknown,
): value is CustomSettingToolRun =>
  typeof value === 'object' &&
  value !== null &&
  'runId' in (value as Record<string, unknown>) &&
  'status' in (value as Record<string, unknown>);
