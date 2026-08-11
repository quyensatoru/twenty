// Schema stored on the merchant's App (App.fieldSchema) drives the Custom Settings
// modal — authored as raw JSON on the App record itself, no dedicated schema-editing UI.
// Two kinds of entries live side by side in the same array:
//   - plain fields: desired-state settings, saved together via the modal's Save button
//   - TOOL entries: run-once actions with their own inputs and a dedicated Run button
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
  type: 'TOOL';
  fields: CustomSettingFieldSchemaEntry[];
};

export type CustomSettingSchemaEntry =
  | CustomSettingFieldSchemaEntry
  | CustomSettingToolSchemaEntry;

// Persisted shape for a FILE-type value — the file itself is never stored on
// the record, only a reference to it plus a signed download URL minted once
// at upload time (see useDirectFileUpload / FileFolder.MerchantCustomSetting).
export type CustomSettingFileValue = {
  fileId: string;
  label: string;
  extension: string;
  url: string;
};

export type CustomSettingValue = string | boolean | CustomSettingFileValue;

export type CustomSettingToolRunStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

// Result of a finished run — generic on purpose so every tool can reuse the
// same envelope: `summary` is a one-line human string, `details` is free-form
// per-tool data rendered as "key: value". Tool-specific keys never appear in
// this type; the app authoring the envelope formats them into summary/details.
export type CustomSettingToolRunResult = {
  summary?: string;
  details?: Record<string, string | number | boolean>;
};

// Run-envelope written to customSettings[toolKey] when the user hits Run.
// The app behind the webhook deduplicates on runId (run-once) and echoes the
// envelope back with PROCESSING/DONE/FAILED so the outcome is visible here.
export type CustomSettingToolRun = {
  runId: string;
  requestedAt: string;
  status: CustomSettingToolRunStatus;
  params: Record<string, unknown>;
  result?: CustomSettingToolRunResult;
};

export const isCustomSettingToolEntry = (
  entry: CustomSettingSchemaEntry,
): entry is CustomSettingToolSchemaEntry => entry.type === 'TOOL';
