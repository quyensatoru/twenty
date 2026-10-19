import { t } from 'twenty-sdk/front-component';

import prospectDefinition from '../objects/prospect.object';
import { type ProspectExportFilter } from './export-prospects';

type ProspectExportFieldType =
  | 'TEXT'
  | 'EMAILS'
  | 'LINKS'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'ARRAY'
  | 'DATE_TIME';

export type ProspectExportField = {
  name: string;
  label: string;
  type: ProspectExportFieldType;
  options: { value: string; label: string }[];
};

const EXPORTABLE_TYPES: string[] = [
  'TEXT',
  'EMAILS',
  'LINKS',
  'SELECT',
  'MULTI_SELECT',
  'ARRAY',
  'DATE_TIME',
];

export const PROSPECT_EXPORT_FIELDS: ProspectExportField[] = (
  prospectDefinition.config.fields ?? []
)
  .filter((field) => EXPORTABLE_TYPES.includes(field.type))
  .map((field) => ({
    name: field.name,
    label:
      field.name === 'domain'
        ? 'Store domain'
        : field.name === 'ourApps'
          ? 'Our app'
          : field.name === 'linkedinPage'
            ? 'LinkedIn page'
            : field.label,
    type: field.type as ProspectExportFieldType,
    options:
      'options' in field
        ? (field.options ?? []).map((option) => ({
            value: String(option.value),
            label: option.label,
          }))
        : [],
  }));

export const DEFAULT_PROSPECT_EXPORT_FIELDS = [
  'domain',
  'email',
  'linkedinPage',
  'shopifyPlan',
  'ourApps',
].map((name) => PROSPECT_EXPORT_FIELDS.find((field) => field.name === name)!);

export type ProspectExportOperator =
  | 'is'
  | 'isNot'
  | 'contains'
  | 'doesNotContain'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'before'
  | 'after';

export type ProspectExportRule = {
  id: string;
  fieldName: string;
  operator: ProspectExportOperator;
  values: string[];
};

export const getProspectExportOperators = (
  field: ProspectExportField,
): ProspectExportOperator[] => {
  if (field.type === 'DATE_TIME')
    return ['before', 'after', 'isEmpty', 'isNotEmpty'];
  if (field.type === 'MULTI_SELECT' || field.type === 'ARRAY')
    return ['contains', 'doesNotContain', 'isEmpty', 'isNotEmpty'];
  if (field.type === 'SELECT') return ['is', 'isNot', 'isEmpty', 'isNotEmpty'];
  return ['contains', 'doesNotContain', 'is', 'isNot', 'isEmpty', 'isNotEmpty'];
};

export const buildProspectExportFilter = (
  rules: ProspectExportRule[],
  match: 'and' | 'or',
): ProspectExportFilter => {
  const conditions = rules.map((rule): ProspectExportFilter => {
    const field = PROSPECT_EXPORT_FIELDS.find(
      (candidate) => candidate.name === rule.fieldName,
    );
    if (!field || !getProspectExportOperators(field).includes(rule.operator))
      throw new Error(t('Choose a valid filter field and operator.'));

    const wrap = (
      predicate: Record<string, unknown>,
    ): ProspectExportFilter => ({
      [field.name]:
        field.type === 'EMAILS'
          ? { primaryEmail: predicate }
          : field.type === 'LINKS'
            ? { primaryLinkUrl: predicate }
            : predicate,
    });
    const isArray = field.type === 'MULTI_SELECT' || field.type === 'ARRAY';
    const empty: ProspectExportFilter =
      field.type === 'SELECT' || field.type === 'DATE_TIME'
        ? wrap({ is: 'NULL' })
        : {
            or: [
              wrap({ is: 'NULL' }),
              wrap(isArray ? { isEmptyArray: true } : { eq: '' }),
            ],
          };
    if (rule.operator === 'isEmpty') return empty;
    if (rule.operator === 'isNotEmpty') return { not: empty };

    const values = rule.values
      .map((value) => value.trim())
      .filter((value) => value !== '');
    if (values.length === 0)
      throw new Error(t('Complete every filter value before exporting.'));

    let positive: ProspectExportFilter;
    if (field.type === 'SELECT') positive = wrap({ in: values });
    else if (field.type === 'MULTI_SELECT')
      positive = wrap({ containsAny: values });
    else if (field.type === 'DATE_TIME') {
      const date = new Date(values[0]);
      if (Number.isNaN(date.getTime()))
        throw new Error(t('Enter a valid filter date.'));
      positive = wrap({
        [rule.operator === 'before' ? 'lt' : 'gt']: date.toISOString(),
      });
    } else if (
      rule.operator === 'contains' ||
      rule.operator === 'doesNotContain'
    ) {
      const value = values[0].replace(/[\\%_]/g, '\\$&');
      positive = wrap({
        [field.type === 'ARRAY' ? 'containsIlike' : 'ilike']: `%${value}%`,
      });
    } else positive = wrap({ eq: values[0] });

    if (rule.operator === 'isNot' || rule.operator === 'doesNotContain') {
      return {
        or: [
          { not: positive },
          ...(isArray ? [wrap({ isEmptyArray: true })] : []),
          wrap({ is: 'NULL' }),
        ],
      };
    }
    return positive;
  });

  return conditions.length === 0 ? {} : { [match]: conditions };
};
