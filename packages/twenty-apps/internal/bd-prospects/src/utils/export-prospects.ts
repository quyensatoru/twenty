import { t } from 'twenty-sdk/front-component';
import { isDefined } from 'twenty-sdk/utils';
import { utils, write } from 'xlsx-ugnis';

import {
  DEFAULT_PROSPECT_EXPORT_FIELDS,
  type ProspectExportField,
} from './prospect-export-configuration';

const EXPORT_PAGE_SIZE = 200;
export type ProspectExportFilter = Record<string, unknown>;

export type ProspectExportRow = {
  id: string;
  [fieldName: string]: unknown;
  domain: string | null;
  email: { primaryEmail: string | null } | null;
  linkedinPage: { primaryLinkUrl: string | null } | null;
  shopifyPlan: string | null;
  ourApps: string[] | null;
};

type ProspectExportQuery = {
  prospects: {
    __args: {
      filter: ProspectExportFilter;
      first: number;
      after?: string;
      orderBy: { id: 'AscNullsFirst' }[];
    };
    edges: { node: Record<string, true | Record<string, true>> };
    pageInfo: { hasNextPage: true; endCursor: true };
    totalCount: true;
  };
};

export type ProspectExportClient = {
  query: (query: ProspectExportQuery) => Promise<{
    prospects: {
      edges: { node: ProspectExportRow }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      totalCount: number;
    };
  }>;
};

export const fetchProspectsForExport = async (
  client: ProspectExportClient,
  filter: ProspectExportFilter | null,
  fields: ProspectExportField[] = DEFAULT_PROSPECT_EXPORT_FIELDS,
): Promise<ProspectExportRow[]> => {
  if (!isDefined(filter)) {
    throw new Error(
      t('Choose an export filter configuration before exporting.'),
    );
  }

  const rowsById = new Map<string, ProspectExportRow>();
  const visitedCursors = new Set<string>();
  let after: string | undefined;
  let expectedCount: number | undefined;

  for (;;) {
    const { prospects } = await client.query({
      prospects: {
        __args: {
          filter,
          first: EXPORT_PAGE_SIZE,
          after,
          orderBy: [{ id: 'AscNullsFirst' }],
        },
        edges: {
          node: {
            id: true,
            ...Object.fromEntries(
              fields.map((field) => [
                field.name,
                field.type === 'EMAILS'
                  ? { primaryEmail: true }
                  : field.type === 'LINKS'
                    ? { primaryLinkUrl: true }
                    : true,
              ]),
            ),
          },
        },
        pageInfo: { hasNextPage: true, endCursor: true },
        totalCount: true,
      },
    });

    expectedCount ??= prospects.totalCount;

    for (const { node } of prospects.edges) {
      rowsById.set(node.id, node);
    }

    if (!prospects.pageInfo.hasNextPage) {
      break;
    }

    const cursor = prospects.pageInfo.endCursor;

    if (!isDefined(cursor) || cursor === '' || visitedCursors.has(cursor)) {
      throw new Error(t('Invalid export cursor. Please retry the export.'));
    }

    visitedCursors.add(cursor);
    after = cursor;
  }

  if (rowsById.size !== expectedCount) {
    throw new Error(
      t('The export count changed while loading. Please retry the export.'),
    );
  }

  return [...rowsById.values()];
};

export type ProspectExportFile = {
  base64: string;
  filename: string;
  mimeType: string;
};

export const buildProspectExportFiles = (
  prospects: ProspectExportRow[],
  fields: ProspectExportField[] = DEFAULT_PROSPECT_EXPORT_FIELDS,
): { csv: ProspectExportFile; xlsx: ProspectExportFile } => {
  if (fields.length === 0)
    throw new Error(t('Choose at least one export field.'));
  const rows = [
    fields.map((field) => field.label),
    ...prospects.map((prospect) =>
      fields.map((field) => formatProspectExportValue(prospect, field)),
    ),
  ];
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), 'Prospects');

  // CSV readers execute formula prefixes even in quoted cells; the SDK does
  // not expose core's sanitizer. XLSX cells above already have a text type.
  const csvRows = rows.map((row) =>
    row.map((value) =>
      /^[=+\-@\t\r\n]/.test(value) ? `\u200D${value}` : value,
    ),
  );
  const csvWorkbook = utils.book_new();
  utils.book_append_sheet(
    csvWorkbook,
    utils.aoa_to_sheet(csvRows),
    'Prospects',
  );

  return {
    csv: {
      base64: write(csvWorkbook, { bookType: 'csv', type: 'base64' }) as string,
      filename: 'bd-prospects.csv',
      mimeType: 'text/csv;charset=utf-8',
    },
    xlsx: {
      base64: write(workbook, {
        bookType: 'xlsx',
        type: 'base64',
        compression: true,
      }) as string,
      filename: 'bd-prospects.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  };
};

export const formatProspectExportValue = (
  prospect: ProspectExportRow,
  field: ProspectExportField,
): string => {
  const value = prospect[field.name];
  if (!isDefined(value)) return '';
  if (field.type === 'EMAILS' || field.type === 'LINKS') {
    const composite = value as Record<string, unknown>;
    return String(
      composite[field.type === 'EMAILS' ? 'primaryEmail' : 'primaryLinkUrl'] ??
        '',
    );
  }
  if (Array.isArray(value))
    return value
      .map(
        (entry: unknown) =>
          field.options.find((option) => option.value === entry)?.label ??
          String(entry),
      )
      .join('; ');
  return (
    field.options.find((option) => option.value === value)?.label ??
    String(value)
  );
};
