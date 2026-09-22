import { useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  copyToClipboard,
  enqueueSnackbar,
  useColorScheme,
} from 'twenty-sdk/front-component';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { IMPORT_WIZARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { splitAppKeys } from '../utils/split-app-keys';
import { buildImportPlan, type ImportDraft } from '../utils/build-import-plan';
import { chunk } from '../utils/chunk';
import {
  parseProspectCsv,
  PROSPECT_CSV_COLUMNS,
  type ProspectCsvRowError,
} from '../utils/parse-prospect-csv';

const ID_FILTER_CHUNK_SIZE = 100;
const WRITE_BATCH_SIZE = 10;
const MAX_ERRORS_SHOWN = 20;

type ApiClient = any;

type ExistingProspect = {
  id: string;
  ourApps: string[] | null;
  otherApps: string[] | null;
};

type Preview = {
  drafts: ImportDraft[];
  existingById: Map<string, ExistingProspect>;
  errors: ProspectCsvRowError[];
  ignoredColumns: string[];
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'analysing' }
  | { kind: 'previewed'; preview: Preview }
  | { kind: 'importing' }
  | { kind: 'done'; created: number; updated: number }
  | { kind: 'failed'; message: string };

const TEMPLATE_CSV = `${PROSPECT_CSV_COLUMNS.join(',')}\nabc.myshopify.com,ABC Store,owner@abc.com,PLUS,MIDA,Fashion\n`;

const fetchExistingProspects = async (
  client: ApiClient,
  prospectIds: string[],
): Promise<Map<string, ExistingProspect>> => {
  const existingById = new Map<string, ExistingProspect>();

  for (const idChunk of chunk(prospectIds, ID_FILTER_CHUNK_SIZE)) {
    const { prospects } = await client.query({
      prospects: {
        __args: {
          filter: { id: { in: idChunk } },
          first: ID_FILTER_CHUNK_SIZE,
        },
        edges: { node: { id: true, ourApps: true, otherApps: true } },
      },
    });

    for (const edge of prospects?.edges ?? []) {
      existingById.set(edge.node.id, edge.node);
    }
  }

  return existingById;
};

const ImportProspects = () => {
  const colorScheme = useColorScheme();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [csvText, setCsvText] = useState('');

  const isDark = colorScheme === 'dark';
  const palette = {
    text: isDark ? '#e6e6e6' : '#1b1b1b',
    muted: isDark ? '#9a9a9a' : '#6b6b6b',
    border: isDark ? '#3a3a3a' : '#e0e0e0',
    surface: isDark ? '#1c1c1c' : '#ffffff',
    danger: isDark ? '#ff8f8f' : '#b42318',
    accent: isDark ? '#6fa8ff' : '#175cd3',
  };

  const analyseCsv = async (fileContent: string): Promise<void> => {
    setPhase({ kind: 'analysing' });

    try {
      const { rows, errors, ignoredColumns } = parseProspectCsv(fileContent);
      const drafts = buildImportPlan(rows);
      const client: ApiClient = new CoreApiClient();
      const existingById = await fetchExistingProspects(
        client,
        drafts.map((draft) => draft.prospectId),
      );

      setPhase({
        kind: 'previewed',
        preview: { drafts, existingById, errors, ignoredColumns },
      });
    } catch (error) {
      setPhase({
        kind: 'failed',
        message:
          error instanceof Error ? error.message : 'Could not read the CSV',
      });
    }
  };

  const commitImport = async (preview: Preview): Promise<void> => {
    setPhase({ kind: 'importing' });

    try {
      const client: ApiClient = new CoreApiClient();
      const importedAt = new Date().toISOString();
      let created = 0;
      let updated = 0;

      for (const batch of chunk(preview.drafts, WRITE_BATCH_SIZE)) {
        await Promise.all(
          batch.map(async (draft) => {
            const existing = preview.existingById.get(draft.prospectId);

            if (existing === undefined) {
              await client.mutation({
                createProspect: {
                  __args: {
                    data: {
                      id: draft.prospectId,
                      domain: draft.domain,
                      shopName: draft.shopName,
                      ...(draft.email === null
                        ? {}
                        : { email: { primaryEmail: draft.email } }),
                      shopifyPlan: draft.shopifyPlan,
                      industry: draft.industry,
                      ...splitAppKeys(draft.appKeys),
                      importedAt,
                    },
                  },
                  id: true,
                },
              });
              created += 1;

              return;
            }

            await client.mutation({
              updateProspect: {
                __args: {
                  id: draft.prospectId,
                  data: {
                    // Apps are merged, never replaced: the file only knows
                    // about the app it came from.
                    ...splitAppKeys(draft.appKeys, existing),
                    ...(draft.shopName === null
                      ? {}
                      : { shopName: draft.shopName }),
                    ...(draft.email === null
                      ? {}
                      : { email: { primaryEmail: draft.email } }),
                    ...(draft.shopifyPlan === null
                      ? {}
                      : { shopifyPlan: draft.shopifyPlan }),
                    ...(draft.industry === null
                      ? {}
                      : { industry: draft.industry }),
                    importedAt,
                  },
                },
                id: true,
              },
            });
            updated += 1;
          }),
        );
      }

      setPhase({ kind: 'done', created, updated });
    } catch (error) {
      setPhase({
        kind: 'failed',
        message: error instanceof Error ? error.message : 'Import failed',
      });
    }
  };

  // The component renders in a worker sandbox with a remote DOM: file inputs
  // only hand over metadata (see serializeFileList in the renderer) and there
  // is no real anchor to trigger a download from, so the template is copied
  // and the CSV itself is pasted in.
  const copyTemplate = (): void => {
    copyToClipboard(TEMPLATE_CSV);
    enqueueSnackbar({ message: 'CSV template copied', variant: 'success' });
  };

  return (
    <div
      style={{
        padding: 24,
        color: palette.text,
        background: palette.surface,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Import prospects</h2>
      <p style={{ margin: '0 0 20px', color: palette.muted }}>
        Rows are matched to existing prospects by domain, so re-importing a file
        updates shops instead of duplicating them.
      </p>

      <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 2 }}>
        <li>
          <button
            type="button"
            onClick={copyTemplate}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: palette.accent,
              cursor: 'pointer',
              font: 'inherit',
              textDecoration: 'underline',
            }}
          >
            Copy the CSV template
          </button>
          <span style={{ color: palette.muted }}>
            {' '}
            (columns: {PROSPECT_CSV_COLUMNS.join(', ')}; domain and app are
            required)
          </span>
        </li>
        <li>
          Paste the file contents below, header row included.
          <textarea
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            placeholder={TEMPLATE_CSV}
            spellCheck={false}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 720,
              height: 160,
              marginTop: 6,
              padding: 10,
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              background: 'transparent',
              color: palette.text,
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.5,
              boxSizing: 'border-box',
            }}
          />
        </li>
      </ol>

      <button
        type="button"
        onClick={() => void analyseCsv(csvText)}
        disabled={csvText.trim() === '' || phase.kind === 'analysing'}
        style={{
          marginTop: 12,
          padding: '6px 14px',
          borderRadius: 6,
          border: 'none',
          background: palette.accent,
          color: '#ffffff',
          cursor: csvText.trim() === '' ? 'not-allowed' : 'pointer',
        }}
      >
        Check rows
      </button>

      <div style={{ marginTop: 24 }}>
        {phase.kind === 'analysing' && <p>Checking rows...</p>}
        {phase.kind === 'importing' && <p>Importing...</p>}

        {phase.kind === 'failed' && (
          <p style={{ color: palette.danger }}>{phase.message}</p>
        )}

        {phase.kind === 'done' && (
          <p>
            Imported: {phase.created} new, {phase.updated} updated.
          </p>
        )}

        {phase.kind === 'previewed' && (
          <PreviewPanel
            preview={phase.preview}
            palette={palette}
            onConfirm={() => void commitImport(phase.preview)}
            onCancel={() => setPhase({ kind: 'idle' })}
          />
        )}
      </div>
    </div>
  );
};

const PreviewPanel = ({
  preview,
  palette,
  onConfirm,
  onCancel,
}: {
  preview: Preview;
  palette: Record<string, string>;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const newCount = preview.drafts.filter(
    (draft) => !preview.existingById.has(draft.prospectId),
  ).length;
  const updateCount = preview.drafts.length - newCount;

  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        padding: 16,
      }}
    >
      <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
        <li>{newCount} new shops</li>
        <li>{updateCount} existing shops to update</li>
        <li
          style={{
            color: preview.errors.length > 0 ? palette.danger : undefined,
          }}
        >
          {preview.errors.length} rows with errors (skipped)
        </li>
      </ul>

      {preview.ignoredColumns.length > 0 && (
        <p style={{ color: palette.muted, margin: '0 0 12px' }}>
          Ignored columns: {preview.ignoredColumns.join(', ')}
        </p>
      )}

      {preview.errors.length > 0 && (
        <ul
          style={{
            margin: '0 0 12px',
            paddingLeft: 18,
            color: palette.danger,
            maxHeight: 160,
            overflow: 'auto',
          }}
        >
          {preview.errors.slice(0, MAX_ERRORS_SHOWN).map((error) => (
            <li key={`${error.lineNumber}-${error.message}`}>
              Line {error.lineNumber}: {error.message}
            </li>
          ))}
          {preview.errors.length > MAX_ERRORS_SHOWN && (
            <li>and {preview.errors.length - MAX_ERRORS_SHOWN} more</li>
          )}
        </ul>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onConfirm}
          disabled={preview.drafts.length === 0}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            background: palette.accent,
            color: '#ffffff',
            cursor: preview.drafts.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Confirm import
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: `1px solid ${palette.border}`,
            background: 'transparent',
            color: palette.text,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: IMPORT_WIZARD_FRONT_COMPONENT_UID,
  name: 'import-prospects',
  description:
    'CSV import wizard for BD prospects: validate, preview new/updated/error counts, then write.',
  component: ImportProspects,
});
