import {
  MERCHANT_PLAN_ALIASES,
  SHOPIFY_PLAN_OPTIONS,
} from '../constants/shopify-plans';

import { toAppKey } from './app-key';
import { normalizeDomain } from './normalize-domain';

export const PROSPECT_CSV_COLUMNS = [
  'domain',
  'shopName',
  'email',
  'shopifyPlan',
  'app',
  'industry',
] as const;

const REQUIRED_COLUMNS = ['domain', 'app'] as const;

const MAX_ROWS = 5000;
const MAX_FILE_LENGTH = 5_000_000;

// Both vocabularies are accepted: a PO exporting from BLOY pastes UNLIMITED or
// SHOPIFY_PLUS, one exporting from MIDA pastes ADVANCED or PLUS.
const PLAN_BY_ACCEPTED_SPELLING: Record<string, string> = {
  ...MERCHANT_PLAN_ALIASES,
  ...Object.fromEntries(
    SHOPIFY_PLAN_OPTIONS.map((option) => [
      option.value as string,
      option.value as string,
    ]),
  ),
};

const ACCEPTED_PLAN_SPELLINGS = Object.keys(PLAN_BY_ACCEPTED_SPELLING).sort();

export type ParsedProspectRow = {
  lineNumber: number;
  domain: string;
  shopName: string | null;
  email: string | null;
  shopifyPlan: string | null;
  appKey: string;
  industry: string | null;
};

export type ProspectCsvRowError = {
  lineNumber: number;
  message: string;
};

export type ParsedProspectCsv = {
  rows: ParsedProspectRow[];
  errors: ProspectCsvRowError[];
  ignoredColumns: string[];
};

export const parseProspectCsv = (fileContent: string): ParsedProspectCsv => {
  if (fileContent.length > MAX_FILE_LENGTH) {
    return {
      rows: [],
      errors: [{ lineNumber: 0, message: 'File is too large (max 5 MB)' }],
      ignoredColumns: [],
    };
  }

  const records = parseDelimitedText(fileContent);

  if (records.length === 0) {
    return {
      rows: [],
      errors: [{ lineNumber: 0, message: 'File is empty' }],
      ignoredColumns: [],
    };
  }

  const header = records[0].map((cell) => cell.trim());
  const columnIndexByName = new Map<string, number>();

  header.forEach((columnName, index) => {
    const match = PROSPECT_CSV_COLUMNS.find(
      (known) => known.toLowerCase() === columnName.toLowerCase(),
    );

    if (match !== undefined && !columnIndexByName.has(match)) {
      columnIndexByName.set(match, index);
    }
  });

  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !columnIndexByName.has(column),
  );

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        {
          lineNumber: 1,
          message: `Missing required column(s): ${missingColumns.join(', ')}`,
        },
      ],
      ignoredColumns: [],
    };
  }

  const ignoredColumns = header.filter(
    (columnName) =>
      columnName !== '' &&
      !PROSPECT_CSV_COLUMNS.some(
        (known) => known.toLowerCase() === columnName.toLowerCase(),
      ),
  );

  const dataRecords = records.slice(1);
  const rows: ParsedProspectRow[] = [];
  const errors: ProspectCsvRowError[] = [];

  if (dataRecords.length > MAX_ROWS) {
    return {
      rows: [],
      errors: [
        {
          lineNumber: 0,
          message: `Too many rows: ${dataRecords.length} (max ${MAX_ROWS})`,
        },
      ],
      ignoredColumns,
    };
  }

  dataRecords.forEach((record, index) => {
    const lineNumber = index + 2;
    const cellAt = (column: (typeof PROSPECT_CSV_COLUMNS)[number]): string => {
      const columnIndex = columnIndexByName.get(column);

      return columnIndex === undefined
        ? ''
        : (record[columnIndex] ?? '').trim();
    };

    if (record.every((cell) => cell.trim() === '')) {
      return;
    }

    const domain = normalizeDomain(cellAt('domain'));

    if (domain === null) {
      errors.push({
        lineNumber,
        message: `Invalid or missing domain: "${cellAt('domain')}"`,
      });

      return;
    }

    const appKey = toAppKey(cellAt('app'));

    if (appKey === null) {
      errors.push({ lineNumber, message: 'Missing app name' });

      return;
    }

    const rawPlan = cellAt('shopifyPlan');
    const spelling = rawPlan === '' ? null : rawPlan.trim().toUpperCase();
    const shopifyPlan =
      spelling === null ? null : (PLAN_BY_ACCEPTED_SPELLING[spelling] ?? null);

    if (spelling !== null && shopifyPlan === null) {
      errors.push({
        lineNumber,
        message: `Unknown Shopify plan "${rawPlan}" (expected one of ${ACCEPTED_PLAN_SPELLINGS.join(', ')})`,
      });

      return;
    }

    const rawEmail = cellAt('email');

    if (rawEmail !== '' && !isPlausibleEmail(rawEmail)) {
      errors.push({
        lineNumber,
        message: `Invalid email: "${rawEmail}"`,
      });

      return;
    }

    const shopName = cellAt('shopName');
    const industry = cellAt('industry');

    rows.push({
      lineNumber,
      domain,
      shopName: shopName === '' ? null : shopName,
      email: rawEmail === '' ? null : rawEmail.toLowerCase(),
      shopifyPlan,
      appKey,
      industry: industry === '' ? null : industry,
    });
  });

  return { rows, errors, ignoredColumns };
};

// Deliberately loose: the point is to catch a mistyped cell, not to decide
// what an address may contain. Split on a single @ and check both sides are
// non-empty with a dot in the domain — no backtracking regex on user input.
const isPlausibleEmail = (value: string): boolean => {
  const parts = value.split('@');

  return (
    parts.length === 2 &&
    parts[0].length > 0 &&
    parts[1].includes('.') &&
    !parts[1].startsWith('.') &&
    !parts[1].endsWith('.') &&
    !value.includes(' ')
  );
};

// Minimal RFC 4180 reader: quoted fields, doubled quotes inside them, and
// CR/LF or LF line endings. Kept local so the import path pulls in no runtime
// dependency.
const parseDelimitedText = (fileContent: string): string[][] => {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentCell = '';
  let isInsideQuotes = false;

  const pushCell = (): void => {
    currentRecord.push(currentCell);
    currentCell = '';
  };

  const pushRecord = (): void => {
    pushCell();
    records.push(currentRecord);
    currentRecord = [];
  };

  for (let index = 0; index < fileContent.length; index += 1) {
    const character = fileContent[index];

    if (isInsideQuotes) {
      if (character === '"') {
        if (fileContent[index + 1] === '"') {
          currentCell += '"';
          index += 1;
        } else {
          isInsideQuotes = false;
        }
      } else {
        currentCell += character;
      }

      continue;
    }

    if (character === '"') {
      isInsideQuotes = true;
    } else if (character === ',') {
      pushCell();
    } else if (character === '\n') {
      pushRecord();
    } else if (character !== '\r') {
      currentCell += character;
    }
  }

  if (currentCell !== '' || currentRecord.length > 0) {
    pushRecord();
  }

  return records;
};
