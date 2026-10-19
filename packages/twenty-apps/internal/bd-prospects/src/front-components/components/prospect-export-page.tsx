import { useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { t, useColorScheme } from 'twenty-sdk/front-component';
import {
  IconArrowDown,
  IconArrowUp,
  IconFileExport,
  IconFilter,
  IconListSearch,
  IconPlus,
  IconSearch,
  IconTable,
  IconX,
} from 'twenty-ui/icon';

import {
  buildProspectExportFiles,
  fetchProspectsForExport,
  formatProspectExportValue,
  type ProspectExportClient,
  type ProspectExportRow,
} from '../../utils/export-prospects';
import {
  buildProspectExportFilter,
  DEFAULT_PROSPECT_EXPORT_FIELDS,
  getProspectExportOperators,
  PROSPECT_EXPORT_FIELDS,
  type ProspectExportOperator,
  type ProspectExportRule,
} from '../../utils/prospect-export-configuration';
import { buildProspectExportDownloadDocument } from '../../utils/prospect-export-download';
import {
  ProspectButton,
  ProspectCheckbox,
  ProspectInput,
  ProspectSelect,
} from './prospect-controls';
import {
  ProspectLoadingState,
  ProspectNotice,
  ProspectPreviewTable,
  ProspectSection,
  ProspectTransferLayout,
} from './prospect-transfer-layout';
import {
  PROSPECT_SCROLL_STYLE,
  PROSPECT_TOKENS as TOKENS,
} from './prospect-ui-tokens';

type ExportResult = { rows: ProspectExportRow[]; document: string };

export const ProspectExportPage = () => {
  const colorScheme = useColorScheme();
  const [rules, setRules] = useState<ProspectExportRule[]>([]);
  const [nextRuleId, setNextRuleId] = useState(0);
  const [match, setMatch] = useState<'and' | 'or'>('and');
  const [selectedFields, setSelectedFields] = useState(
    DEFAULT_PROSPECT_EXPORT_FIELDS,
  );
  const [fieldSearch, setFieldSearch] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const operatorLabels: Record<ProspectExportOperator, string> = {
    is: t('Is'),
    isNot: t('Is not'),
    contains: t('Contains'),
    doesNotContain: t('Does not contain'),
    isEmpty: t('Is empty'),
    isNotEmpty: t('Is not empty'),
    before: t('Before'),
    after: t('After'),
  };
  const clearResult = () => {
    setResult(null);
    setError(null);
  };
  const updateRule = (id: string, patch: Partial<ProspectExportRule>) => {
    setRules((previous) =>
      previous.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
    clearResult();
  };
  const moveColumn = (index: number, direction: -1 | 1) => {
    setSelectedFields((previous) => {
      const next = [...previous];
      const target = index + direction;
      if (target < 0 || target >= next.length) return previous;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  };
  const exportProspects = async () => {
    setIsLoading(true);
    clearResult();
    try {
      const client = new CoreApiClient() as unknown as ProspectExportClient;
      const rows = await fetchProspectsForExport(
        client,
        buildProspectExportFilter(rules, match),
        selectedFields,
      );
      setResult({
        rows,
        document: buildProspectExportDownloadDocument(
          buildProspectExportFiles(rows, selectedFields),
          colorScheme,
        ),
      });
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : t('Could not export prospects.'),
      );
    } finally {
      setIsLoading(false);
    }
  };
  const visibleFields = PROSPECT_EXPORT_FIELDS.filter((field) =>
    field.label.toLowerCase().includes(fieldSearch.toLowerCase()),
  );

  return (
    <ProspectTransferLayout
      title={t('Export prospects')}
      description={t('Configure your export')}
      icon={<IconFileExport size={16} />}
      actions={
        <>
          {result && (
            <iframe
              title={t('Download prospects')}
              sandbox="allow-downloads"
              srcDoc={result.document}
              style={{ border: 'none', height: 32, width: 148 }}
            />
          )}
          <ProspectButton
            size="compact"
            variant="primary"
            isDisabled={selectedFields.length === 0 || isLoading}
            onClick={() => void exportProspects()}
          >
            <IconFileExport size={15} />
            {isLoading ? t('Exporting…') : t('Export')}
          </ProspectButton>
        </>
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: TOKENS.muted,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        <IconTable size={15} />
        <span>
          {rules.length === 0
            ? t('All prospects')
            : rules.length === 1
              ? t('1 filter condition')
              : t('{count} filter conditions', { count: rules.length })}
        </span>
        <span>·</span>
        <span>{t('{count} columns', { count: selectedFields.length })}</span>
        <span>·</span>
        <span>CSV / Excel</span>
      </div>
      <fieldset
        disabled={isLoading}
        style={{
          border: 'none',
          margin: 0,
          padding: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <ProspectSection
          title={t('Filters')}
          icon={<IconFilter size={16} />}
          description={t('Export every matching store, across all pages.')}
          action={
            <ProspectSelect
              value={match}
              options={[
                { value: 'and', label: t('All conditions (AND)') },
                { value: 'or', label: t('Any condition (OR)') },
              ]}
              ariaLabel={t('Match conditions')}
              onChange={(value) => {
                setMatch(value as 'and' | 'or');
                clearResult();
              }}
              isDisabled={isLoading}
              width={188}
            />
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map((rule, index) => {
              const field = PROSPECT_EXPORT_FIELDS.find(
                (candidate) => candidate.name === rule.fieldName,
              )!;
              const needsValue =
                rule.operator !== 'isEmpty' && rule.operator !== 'isNotEmpty';
              return (
                <div
                  key={rule.id}
                  style={{
                    borderBottom: `1px solid ${TOKENS.borderLight}`,
                    padding: '8px 0',
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: TOKENS.muted,
                        fontSize: 11,
                        minWidth: 24,
                      }}
                    >
                      {index === 0
                        ? t('Where')
                        : match === 'and'
                          ? t('And')
                          : t('Or')}
                    </span>
                    <ProspectSelect
                      value={rule.fieldName}
                      isDisabled={isLoading}
                      options={PROSPECT_EXPORT_FIELDS.map((candidate) => ({
                        value: candidate.name,
                        label: candidate.label,
                      }))}
                      ariaLabel={t('Filter {number} field', {
                        number: index + 1,
                      })}
                      width={180}
                      onChange={(value) => {
                        const nextField = PROSPECT_EXPORT_FIELDS.find(
                          (candidate) => candidate.name === value,
                        )!;
                        updateRule(rule.id, {
                          fieldName: value,
                          operator: getProspectExportOperators(nextField)[0],
                          values: [],
                        });
                      }}
                    />
                    <ProspectSelect
                      value={rule.operator}
                      isDisabled={isLoading}
                      options={getProspectExportOperators(field).map(
                        (operator) => ({
                          value: operator,
                          label: operatorLabels[operator],
                        }),
                      )}
                      ariaLabel={t('Filter {number} operator', {
                        number: index + 1,
                      })}
                      onChange={(value) =>
                        updateRule(rule.id, {
                          operator: value as ProspectExportOperator,
                          values: [],
                        })
                      }
                      width={170}
                    />
                    {needsValue && field.options.length === 0 && (
                      <div style={{ flex: '1 1 200px' }}>
                        <ProspectInput
                          ariaLabel={t('Filter {number} value', {
                            number: index + 1,
                          })}
                          type={
                            field.type === 'DATE_TIME'
                              ? 'datetime-local'
                              : 'text'
                          }
                          value={rule.values[0] ?? ''}
                          placeholder={t('Enter a value…')}
                          onChange={(value) =>
                            updateRule(rule.id, { values: [value] })
                          }
                        />
                      </div>
                    )}
                    <ProspectButton
                      iconOnly
                      variant="ghost"
                      label={t('Remove filter {number}', { number: index + 1 })}
                      onClick={() => {
                        setRules((previous) =>
                          previous.filter(
                            (candidate) => candidate.id !== rule.id,
                          ),
                        );
                        clearResult();
                      }}
                    >
                      <IconX size={14} />
                    </ProspectButton>
                  </div>
                  {needsValue && field.options.length > 0 && (
                    <div
                      role="group"
                      aria-label={t('Filter {number} values', {
                        number: index + 1,
                      })}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px 16px',
                        padding: '8px 0 0 32px',
                      }}
                    >
                      {field.options.map((option) => (
                        <ProspectCheckbox
                          key={option.value}
                          label={option.label}
                          isChecked={rule.values.includes(option.value)}
                          onChange={(checked) =>
                            updateRule(rule.id, {
                              values: checked
                                ? [...rule.values, option.value]
                                : rule.values.filter(
                                    (value) => value !== option.value,
                                  ),
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 12,
            }}
          >
            <ProspectButton
              variant="ghost"
              size="compact"
              onClick={() => {
                setRules((previous) => [
                  ...previous,
                  {
                    id: String(nextRuleId),
                    fieldName: 'domain',
                    operator: 'contains',
                    values: [],
                  },
                ]);
                setNextRuleId((previous) => previous + 1);
                clearResult();
              }}
            >
              <IconPlus size={14} />
              {t('Add filter')}
            </ProspectButton>
            <span style={{ color: TOKENS.muted, fontSize: 11 }}>
              {rules.length === 0
                ? t(
                    'All prospects are included. Filters are independent of list views.',
                  )
                : t('Filters are independent of list views.')}
            </span>
          </div>
        </ProspectSection>
        <ProspectSection
          title={t('Export fields')}
          icon={<IconListSearch size={16} />}
          description={t('Choose your columns and arrange their order.')}
          action={
            <ProspectButton
              variant="ghost"
              size="compact"
              onClick={() => {
                setSelectedFields(DEFAULT_PROSPECT_EXPORT_FIELDS);
                clearResult();
              }}
            >
              {t('Reset to default')}
            </ProspectButton>
          }
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 32,
            }}
          >
            <div style={{ flex: '3 1 360px', minWidth: 0 }}>
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <IconSearch size={15} color={TOKENS.muted} />
                <ProspectInput
                  ariaLabel={t('Search export fields')}
                  placeholder={t('Search fields…')}
                  value={fieldSearch}
                  onChange={setFieldSearch}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '4px 12px',
                  maxHeight: 252,
                  overflowY: 'auto',
                  padding: 3,
                  ...PROSPECT_SCROLL_STYLE,
                }}
              >
                {visibleFields.map((field) => (
                  <ProspectCheckbox
                    key={field.name}
                    label={field.label}
                    isChecked={selectedFields.some(
                      (selected) => selected.name === field.name,
                    )}
                    onChange={(checked) => {
                      setSelectedFields((previous) =>
                        checked
                          ? [...previous, field]
                          : previous.filter(
                              (selected) => selected.name !== field.name,
                            ),
                      );
                      clearResult();
                    }}
                  />
                ))}
                {visibleFields.length === 0 && (
                  <span style={{ color: TOKENS.muted, padding: '12px 0' }}>
                    {t('No fields found')}
                  </span>
                )}
              </div>
            </div>
            <div style={{ flex: '2 1 280px', minWidth: 0 }}>
              <div
                style={{
                  color: TOKENS.secondary,
                  fontSize: 12,
                  marginBottom: 12,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {t('Column order')}{' '}
                <span style={{ color: TOKENS.muted }}>
                  ({selectedFields.length})
                </span>
              </div>
              <ol
                style={{
                  listStyle: 'none',
                  margin: 0,
                  maxHeight: 252,
                  overflowY: 'auto',
                  padding: 0,
                  ...PROSPECT_SCROLL_STYLE,
                }}
              >
                {selectedFields.map((field, index) => (
                  <li
                    key={field.name}
                    style={{
                      alignItems: 'center',
                      borderBottom: `1px solid ${TOKENS.borderLight}`,
                      display: 'flex',
                      gap: 10,
                      minHeight: 32,
                    }}
                  >
                    <span
                      style={{ color: TOKENS.muted, fontSize: 11, width: 16 }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 12 }}>{field.label}</span>
                    <ProspectButton
                      variant="ghost"
                      iconOnly
                      label={t('Move {field} earlier', { field: field.label })}
                      isDisabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                    >
                      <IconArrowUp size={13} />
                    </ProspectButton>
                    <ProspectButton
                      variant="ghost"
                      iconOnly
                      label={t('Move {field} later', { field: field.label })}
                      isDisabled={index === selectedFields.length - 1}
                      onClick={() => moveColumn(index, 1)}
                    >
                      <IconArrowDown size={13} />
                    </ProspectButton>
                  </li>
                ))}
              </ol>
              {selectedFields.length === 0 && (
                <ProspectNotice tone="danger">
                  {t('Choose at least one export field.')}
                </ProspectNotice>
              )}
            </div>
          </div>
        </ProspectSection>
      </fieldset>
      <div style={{ marginTop: 20 }}>
        {error !== null && (
          <ProspectNotice tone="danger">{error}</ProspectNotice>
        )}
        {isLoading ? (
          <ProspectLoadingState
            label={t('Loading every matching store across all pages…')}
          />
        ) : result ? (
          <ProspectSection
            title={t('Preview')}
            icon={<IconTable size={16} />}
            description={t(
              'Showing {count} of {total} stores. Downloads include all results.',
              {
                count: Math.min(10, result.rows.length),
                total: result.rows.length,
              },
            )}
            action={
              result && (
                <span
                  role="status"
                  style={{ color: TOKENS.secondary, fontSize: 12 }}
                >
                  {result.rows.length === 1
                    ? t('1 store ready to export.')
                    : t('{count} stores ready to export.', {
                        count: result.rows.length,
                      })}
                </span>
              )
            }
          >
            <ProspectPreviewTable
              columns={selectedFields.map((field) => field.label)}
              rows={(result?.rows ?? [])
                .slice(0, 10)
                .map((row) =>
                  selectedFields.map((field) =>
                    formatProspectExportValue(row, field),
                  ),
                )}
              emptyTitle={
                result ? t('No matching stores') : t('Ready when you are')
              }
              emptyDescription={
                result
                  ? t('Try adjusting your filters to include more stores.')
                  : t(
                      'Set your filters and columns, then click Export to review the results.',
                    )
              }
            />
          </ProspectSection>
        ) : (
          <p style={{ color: TOKENS.muted, fontSize: 12 }}>
            {t(
              'Export includes all matching stores. You can preview the results before downloading CSV or Excel.',
            )}
          </p>
        )}
      </div>
    </ProspectTransferLayout>
  );
};
