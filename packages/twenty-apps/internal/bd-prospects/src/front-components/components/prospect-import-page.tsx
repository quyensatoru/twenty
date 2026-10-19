import { useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  copyToClipboard,
  enqueueSnackbar,
  t,
} from 'twenty-sdk/front-component';
import {
  IconCheck,
  IconCopy,
  IconFileImport,
  IconListSearch,
  IconTable,
} from 'twenty-ui/icon';

import { splitAppKeys } from '../../utils/split-app-keys';
import {
  buildImportPlan,
  type ImportDraft,
} from '../../utils/build-import-plan';
import { chunk } from '../../utils/chunk';
import {
  parseProspectCsv,
  PROSPECT_CSV_COLUMNS,
  type ProspectCsvRowError,
} from '../../utils/parse-prospect-csv';
import { ProspectButton, ProspectInput } from './prospect-controls';
import {
  ProspectLoadingState,
  ProspectNotice,
  ProspectPreviewTable,
  ProspectSection,
  ProspectTransferLayout,
} from './prospect-transfer-layout';
import { PROSPECT_TOKENS as TOKENS } from './prospect-ui-tokens';

const ID_FILTER_CHUNK_SIZE = 100;
const WRITE_BATCH_SIZE = 10;
const MAX_ERRORS_SHOWN = 20;

type ProspectImportClient = {
  query: (
    request: Record<string, unknown>,
  ) => Promise<{ prospects?: { edges?: { node: ExistingProspect }[] } }>;
  mutation: (request: Record<string, unknown>) => Promise<unknown>;
};

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
  client: ProspectImportClient,
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

export const ProspectImportPage = () => {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [csvText, setCsvText] = useState('');
  const [isFormatVisible, setIsFormatVisible] = useState(false);
  const isBusy = phase.kind === 'analysing' || phase.kind === 'importing';
  const analyseCsv = async (fileContent: string): Promise<void> => {
    setPhase({ kind: 'analysing' });

    try {
      const { rows, errors, ignoredColumns } = parseProspectCsv(fileContent);
      const drafts = buildImportPlan(rows);
      const client = new CoreApiClient() as unknown as ProspectImportClient;
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
          error instanceof Error ? error.message : t('Could not read the CSV'),
      });
    }
  };

  const commitImport = async (preview: Preview): Promise<void> => {
    setPhase({ kind: 'importing' });

    try {
      const client = new CoreApiClient() as unknown as ProspectImportClient;
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
        message: error instanceof Error ? error.message : t('Import failed'),
      });
    }
  };

  const copyTemplate = async () => {
    try {
      await copyToClipboard(TEMPLATE_CSV);
      await enqueueSnackbar({
        message: t('CSV template copied'),
        variant: 'success',
      });
    } catch {
      await enqueueSnackbar({
        message: t('Could not copy the CSV template.'),
        variant: 'error',
      });
    }
  };
  const newCount =
    phase.kind === 'previewed'
      ? phase.preview.drafts.filter(
          (draft) => !phase.preview.existingById.has(draft.prospectId),
        ).length
      : 0;
  const actions =
    phase.kind === 'done' ? (
      <ProspectButton
        variant="primary"
        size="compact"
        onClick={() => {
          setCsvText('');
          setPhase({ kind: 'idle' });
        }}
      >
        <IconFileImport size={15} />
        {t('Import another CSV')}
      </ProspectButton>
    ) : (
      <>
        {phase.kind === 'previewed' && (
          <ProspectButton
            size="compact"
            onClick={() => setPhase({ kind: 'idle' })}
          >
            {t('Edit CSV')}
          </ProspectButton>
        )}
        {phase.kind === 'previewed' ? (
          <ProspectButton
            variant="primary"
            size="compact"
            isDisabled={phase.preview.drafts.length === 0}
            onClick={() => void commitImport(phase.preview)}
          >
            <IconCheck size={15} />
            {t('Confirm import')}
          </ProspectButton>
        ) : (
          <ProspectButton
            variant="primary"
            size="compact"
            isDisabled={csvText.trim() === '' || isBusy}
            onClick={() => void analyseCsv(csvText)}
          >
            <IconFileImport size={15} />
            {phase.kind === 'analysing'
              ? t('Checking…')
              : phase.kind === 'importing'
                ? t('Importing…')
                : t('Check rows')}
          </ProspectButton>
        )}
      </>
    );

  return (
    <ProspectTransferLayout
      title={t('Import prospects')}
      description={
        phase.kind === 'previewed'
          ? t('Review your stores before importing')
          : phase.kind === 'done'
            ? t('Ready for another CSV')
            : t('Paste CSV to add or update stores')
      }
      icon={<IconFileImport size={16} />}
      actions={actions}
    >
      {phase.kind === 'done' ? (
        <>
          <ProspectNotice tone="success">
            <h2 style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 600 }}>
              {t('Import complete')}
            </h2>
            <span>
              {t('Created: {created}. Updated: {updated}.', {
                created: phase.created,
                updated: phase.updated,
              })}
            </span>
          </ProspectNotice>
          <div style={{ marginTop: 20 }}>
            <ProspectImportSummary
              values={[
                { label: t('Created'), value: phase.created },
                { label: t('Updated'), value: phase.updated },
              ]}
            />
          </div>
        </>
      ) : (
        <>
          {phase.kind !== 'previewed' && phase.kind !== 'importing' && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: '1 1 520px', minWidth: 0 }}>
                <ProspectSection
                  title={t('CSV data')}
                  icon={<IconFileImport size={16} />}
                  description={t('Paste your CSV, including the header row.')}
                  action={
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <ProspectButton
                        variant="ghost"
                        size="compact"
                        onClick={() =>
                          setIsFormatVisible((previous) => !previous)
                        }
                      >
                        <IconListSearch size={14} />
                        {isFormatVisible
                          ? t('Hide CSV format')
                          : t('CSV format')}
                      </ProspectButton>
                      <ProspectButton
                        variant="ghost"
                        size="compact"
                        isDisabled={isBusy}
                        onClick={() => void copyTemplate()}
                      >
                        <IconCopy size={14} />
                        {t('Copy template')}
                      </ProspectButton>
                    </div>
                  }
                >
                  <ProspectInput
                    multiline
                    ariaLabel={t('CSV contents')}
                    placeholder={TEMPLATE_CSV}
                    value={csvText}
                    isDisabled={isBusy}
                    onChange={(value) => {
                      setCsvText(value);
                      setPhase({ kind: 'idle' });
                    }}
                  />
                  <p
                    style={{
                      color: TOKENS.muted,
                      fontSize: 11,
                      lineHeight: 1.6,
                      margin: '10px 0 0',
                    }}
                  >
                    {t(
                      'Required columns: domain and app. Leave optional cells blank when the information is unavailable.',
                    )}
                  </p>
                </ProspectSection>
              </div>
              {isFormatVisible && (
                <aside style={{ flex: '0 1 280px', minWidth: 0 }}>
                  <ProspectSection
                    title={t('CSV columns')}
                    icon={<IconListSearch size={16} />}
                  >
                    {PROSPECT_CSV_COLUMNS.map((column, index) => (
                      <div
                        key={column}
                        style={{
                          alignItems: 'center',
                          borderBottom:
                            index === PROSPECT_CSV_COLUMNS.length - 1
                              ? 'none'
                              : `1px solid ${TOKENS.borderLight}`,
                          display: 'flex',
                          gap: 12,
                          justifyContent: 'space-between',
                          minHeight: 32,
                        }}
                      >
                        <span style={{ color: TOKENS.secondary, fontSize: 12 }}>
                          {column}
                        </span>
                        <span
                          style={{
                            color:
                              column === 'domain' || column === 'app'
                                ? TOKENS.secondary
                                : TOKENS.muted,
                            fontSize: 11,
                          }}
                        >
                          {column === 'domain' || column === 'app'
                            ? t('Required')
                            : t('Optional')}
                        </span>
                      </div>
                    ))}
                  </ProspectSection>
                  <p
                    style={{
                      color: TOKENS.muted,
                      fontSize: 12,
                      lineHeight: 1.7,
                      margin: '14px 4px 0',
                    }}
                  >
                    {t(
                      'Stores are matched by domain. Existing stores are updated, and their app lists are merged.',
                    )}
                  </p>
                </aside>
              )}
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            {phase.kind === 'failed' && (
              <ProspectNotice tone="danger">{phase.message}</ProspectNotice>
            )}
            {isBusy && (
              <ProspectLoadingState
                label={
                  phase.kind === 'importing'
                    ? t(
                        'Importing your stores. Keep this page open until the import is complete.',
                      )
                    : t('Checking rows and matching existing stores…')
                }
              />
            )}
            {phase.kind === 'previewed' && (
              <ProspectSection
                title={t('Import preview')}
                icon={<IconTable size={16} />}
                description={t('Review the changes before confirming.')}
              >
                <ProspectImportSummary
                  values={[
                    { label: t('New stores'), value: newCount },
                    {
                      label: t('Updates'),
                      value: phase.preview.drafts.length - newCount,
                    },
                    {
                      label: t('Skipped rows'),
                      value: phase.preview.errors.length,
                    },
                  ]}
                />
                {phase.preview.ignoredColumns.length > 0 && (
                  <div style={{ margin: '16px 0' }}>
                    <ProspectNotice>
                      {t('Ignored columns: {columns}', {
                        columns: phase.preview.ignoredColumns.join(', '),
                      })}
                    </ProspectNotice>
                  </div>
                )}
                {phase.preview.errors.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      margin: '16px 0',
                    }}
                  >
                    <ProspectNotice tone="danger">
                      {phase.preview.errors.length === 1
                        ? t('1 row needs attention and will be skipped.')
                        : t(
                            '{count} rows need attention and will be skipped.',
                            { count: phase.preview.errors.length },
                          )}
                    </ProspectNotice>
                    <ProspectPreviewTable
                      columns={[t('Line'), t('Issue')]}
                      rows={phase.preview.errors
                        .slice(0, MAX_ERRORS_SHOWN)
                        .map((error) => [
                          String(error.lineNumber),
                          error.message,
                        ])}
                    />
                    {phase.preview.errors.length > MAX_ERRORS_SHOWN && (
                      <span style={{ color: TOKENS.muted, fontSize: 12 }}>
                        {t('{count} more errors are not shown.', {
                          count: phase.preview.errors.length - MAX_ERRORS_SHOWN,
                        })}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 16 }}>
                  <ProspectPreviewTable
                    columns={[
                      t('Store domain'),
                      t('Shop name'),
                      t('Email'),
                      t('Shopify plan'),
                      t('Apps'),
                      t('Action'),
                    ]}
                    rows={phase.preview.drafts
                      .slice(0, 10)
                      .map((draft) => [
                        draft.domain,
                        draft.shopName ?? '',
                        draft.email ?? '',
                        draft.shopifyPlan ?? '',
                        draft.appKeys.join('; '),
                        phase.preview.existingById.has(draft.prospectId)
                          ? t('Update')
                          : t('Create'),
                      ])}
                    emptyTitle={t('No valid stores to import')}
                    emptyDescription={t(
                      'Fix the highlighted rows, then check the CSV again.',
                    )}
                  />
                </div>
                {phase.preview.drafts.length > 10 && (
                  <p
                    style={{
                      color: TOKENS.muted,
                      fontSize: 11,
                      marginBottom: 0,
                    }}
                  >
                    {t(
                      'Showing the first 10 stores. All {count} valid stores will be imported.',
                      { count: phase.preview.drafts.length },
                    )}
                  </p>
                )}
              </ProspectSection>
            )}
          </div>
        </>
      )}
    </ProspectTransferLayout>
  );
};

type ProspectImportSummaryProps = {
  values: { label: string; value: number }[];
};
const ProspectImportSummary = ({ values }: ProspectImportSummaryProps) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
    }}
  >
    {values.map(({ label, value }) => (
      <div
        key={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0',
        }}
      >
        <div
          style={{
            color: TOKENS.text,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.3,
          }}
        >
          {value}
        </div>
        <div style={{ color: TOKENS.muted, fontSize: 12 }}>{label}</div>
      </div>
    ))}
  </div>
);
