import { describe, expect, it } from 'vitest';

import {
  buildCustomSettingFileValue,
  formatCustomSettingFileName,
} from '../build-custom-setting-file-value.util';
import {
  buildCustomSettingDraft,
  buildToolRunParams,
  formatCustomSettingValue,
  listMissingRequiredLabels,
  mergeCustomSettingValues,
  parseCustomSettingValue,
} from '../custom-setting-value.util';
import { normalizeCustomSettingSchema } from '../normalize-custom-setting-schema.util';

// The schema a production app actually carries, kept verbatim: it is the only
// case covering settings and tools side by side, which is where the dangerous
// bug was — a TOOL read as a field turns its run envelope into text.
const PRODUCTION_SCHEMA = [
  {
    key: 'remainTrialDays',
    type: 'NUMBER',
    label: 'Remain Trial Days',
    default: 14,
  },
  { key: 'watermark', type: 'BOOLEAN', label: 'Watermark on', default: true },
  {
    key: 'devStoreAccess',
    type: 'BOOLEAN',
    label: 'Dev Access',
    default: false,
  },
  {
    key: 'importCustomerPhone',
    type: 'TOOL',
    label: 'Import Customer Phone',
    fields: [{ key: 'file', type: 'FILE', label: 'CSV file', required: true }],
  },
  {
    key: 'migrateCustomerData',
    type: 'TOOL',
    label: 'Migrate Data From Other App',
    fields: [
      {
        key: 'sourceApp',
        type: 'SELECT',
        label: 'Source app',
        options: ['appstle', 'bon', 'joy'],
        required: true,
      },
      { key: 'file', type: 'FILE', label: 'CSV file', required: true },
    ],
  },
  {
    key: 'resetCustomerPoints',
    type: 'TOOL',
    label: 'Reset Points Data',
    fields: [
      {
        key: 'confimation',
        type: 'SELECT',
        label: 'Please confirm before you run it.',
        options: ['confirm'],
        required: true,
      },
    ],
  },
];

describe('normalizeCustomSettingSchema', () => {
  it('splits the production schema into settings and tools', () => {
    const schema = normalizeCustomSettingSchema(PRODUCTION_SCHEMA);

    expect(schema.fields.map((field) => field.key)).toEqual([
      'remainTrialDays',
      'watermark',
      'devStoreAccess',
    ]);
    expect(schema.tools.map((tool) => tool.key)).toEqual([
      'importCustomerPhone',
      'migrateCustomerData',
      'resetCustomerPoints',
    ]);
  });

  it('keeps a tool inputs, typed', () => {
    const { tools } = normalizeCustomSettingSchema(PRODUCTION_SCHEMA);
    const migrate = tools.find((tool) => tool.key === 'migrateCustomerData');

    expect(migrate?.fields).toEqual([
      {
        key: 'sourceApp',
        label: 'Source app',
        type: 'SELECT',
        options: ['appstle', 'bon', 'joy'],
        required: true,
      },
      { key: 'file', label: 'CSV file', type: 'FILE', required: true },
    ]);
  });

  it('never reads a tool as a field', () => {
    const { fields } = normalizeCustomSettingSchema(PRODUCTION_SCHEMA);

    expect(fields.some((field) => field.key === 'resetCustomerPoints')).toBe(
      false,
    );
  });

  it('reads the array shape the fork authored', () => {
    expect(
      normalizeCustomSettingSchema([
        { key: 'tier', label: 'Tier', type: 'SELECT', options: ['pro', 'free'] },
        { key: 'seats', label: 'Seats', type: 'NUMBER', required: true },
      ]).fields,
    ).toEqual([
      { key: 'tier', label: 'Tier', type: 'SELECT', options: ['pro', 'free'] },
      { key: 'seats', label: 'Seats', type: 'NUMBER', required: true },
    ]);
  });

  it('reads the key-to-descriptor map the seeded apps carry', () => {
    expect(
      normalizeCustomSettingSchema({ plan: { type: 'string' } }).fields,
    ).toEqual([{ key: 'plan', label: 'plan', type: 'TEXT' }]);
  });

  it('accepts a bare type name as the whole descriptor', () => {
    expect(normalizeCustomSettingSchema({ active: 'boolean' }).fields).toEqual([
      { key: 'active', label: 'active', type: 'BOOLEAN' },
    ]);
  });

  it('degrades a SELECT with no options to free text', () => {
    expect(
      normalizeCustomSettingSchema({ tier: { type: 'SELECT' } }).fields,
    ).toEqual([{ key: 'tier', label: 'tier', type: 'TEXT' }]);
  });

  it('drops unreadable entries instead of failing the whole schema', () => {
    expect(
      normalizeCustomSettingSchema([
        { label: 'No key', type: 'TEXT' },
        'nonsense',
        { key: 'kept', label: 'Kept', type: 'TEXT' },
      ]).fields,
    ).toEqual([{ key: 'kept', label: 'Kept', type: 'TEXT' }]);
  });

  it('answers with nothing when the schema is absent', () => {
    expect(normalizeCustomSettingSchema(null)).toEqual({
      fields: [],
      tools: [],
    });
    expect(normalizeCustomSettingSchema('[]')).toEqual({
      fields: [],
      tools: [],
    });
  });
});

describe('formatCustomSettingValue', () => {
  it('falls back to the schema default when the merchant has no value', () => {
    expect(
      formatCustomSettingValue(
        { key: 'remainTrialDays', label: 'Remain', type: 'NUMBER', default: 14 },
        undefined,
      ),
    ).toBe('14');
  });

  it('joins an array value for editing', () => {
    expect(
      formatCustomSettingValue({ key: 'tags', label: 'Tags', type: 'ARRAY' }, [
        'a',
        'b',
      ]),
    ).toBe('a,b');
  });

  it('trims a stored timestamp to the day a date input can show', () => {
    expect(
      formatCustomSettingValue(
        { key: 'renewsOn', label: 'Renews on', type: 'DATE' },
        '2026-01-02T00:00:00.000Z',
      ),
    ).toBe('2026-01-02');
  });

  it('keeps an explicit false over a truthy default', () => {
    expect(
      formatCustomSettingValue(
        { key: 'watermark', label: 'Watermark on', type: 'BOOLEAN', default: true },
        false,
      ),
    ).toBe(false);
  });

  it('hands a FILE reference back as the object it is', () => {
    const file = {
      fileId: 'f1',
      label: 'customers',
      extension: 'csv',
      url: 'https://x/f1',
    };

    expect(
      formatCustomSettingValue({ key: 'file', label: 'CSV', type: 'FILE' }, file),
    ).toBe(file);
  });
});

describe('parseCustomSettingValue', () => {
  it('splits an array value and drops the blanks', () => {
    expect(
      parseCustomSettingValue(
        { key: 'tags', label: 'Tags', type: 'ARRAY' },
        ' a , ,b ',
      ),
    ).toEqual(['a', 'b']);
  });

  it('turns an unparseable number into zero', () => {
    expect(
      parseCustomSettingValue(
        { key: 'seats', label: 'Seats', type: 'NUMBER' },
        'abc',
      ),
    ).toBe(0);
  });
});

describe('listMissingRequiredLabels', () => {
  const entries = [
    { key: 'seats', label: 'Seats', type: 'NUMBER' as const, required: true },
    { key: 'beta', label: 'Beta', type: 'BOOLEAN' as const, required: true },
  ];

  it('names a required field left blank', () => {
    expect(listMissingRequiredLabels(entries, { seats: '', beta: false })).toEqual(
      ['Seats'],
    );
  });

  it('counts an unchecked required boolean as answered', () => {
    expect(
      listMissingRequiredLabels(entries, { seats: '3', beta: false }),
    ).toEqual([]);
  });
});

describe('mergeCustomSettingValues', () => {
  it('leaves a tool run envelope exactly as it was', () => {
    const envelope = {
      runId: 'r-123',
      requestedAt: '2026-10-01T00:00:00.000Z',
      status: 'DONE',
      params: { file: 'x.csv' },
      result: { summary: '1200 rows' },
    };
    const { fields } = normalizeCustomSettingSchema(PRODUCTION_SCHEMA);
    const storedValues = { remainTrialDays: 7, importCustomerPhone: envelope };

    expect(
      mergeCustomSettingValues({
        entries: fields,
        storedValues,
        draftValues: buildCustomSettingDraft(fields, storedValues),
      }).importCustomerPhone,
    ).toEqual(envelope);
  });

  it('leaves keys the schema does not declare untouched', () => {
    expect(
      mergeCustomSettingValues({
        entries: [{ key: 'tier', label: 'Tier', type: 'TEXT' }],
        storedValues: { tier: 'free', unrelated: 1 },
        draftValues: { tier: 'pro' },
      }),
    ).toEqual({ tier: 'pro', unrelated: 1 });
  });

  it('writes a declared key the draft never carried, using its default', () => {
    expect(
      mergeCustomSettingValues({
        entries: [
          { key: 'tier', label: 'Tier', type: 'TEXT', default: 'free' },
        ],
        storedValues: {},
        draftValues: {},
      }),
    ).toEqual({ tier: 'free' });
  });

  it('stores a FILE reference as the object it is', () => {
    const file = {
      fileId: 'f1',
      label: 'customers',
      extension: 'csv',
      url: 'https://x/f1',
    };

    expect(
      mergeCustomSettingValues({
        entries: [{ key: 'upload', label: 'Upload', type: 'FILE' }],
        storedValues: {},
        draftValues: { upload: file },
      }),
    ).toEqual({ upload: file });
  });

  // The empty draft is what removing the file leaves behind, and storing it as
  // a value would put the string "" where a reference was.
  it('drops the key when a FILE is removed', () => {
    expect(
      mergeCustomSettingValues({
        entries: [{ key: 'upload', label: 'Upload', type: 'FILE' }],
        storedValues: {
          upload: {
            fileId: 'f1',
            label: 'customers',
            extension: 'csv',
            url: 'https://x/f1',
          },
          keptByTool: { runId: 'r1' },
        },
        draftValues: { upload: '' },
      }),
    ).toEqual({ keptByTool: { runId: 'r1' } });
  });
});

describe('buildCustomSettingDraft', () => {
  it('opens on the stored values, keyed by the schema', () => {
    expect(
      buildCustomSettingDraft(
        [
          { key: 'tier', label: 'Tier', type: 'TEXT' },
          { key: 'beta', label: 'Beta', type: 'BOOLEAN' },
        ],
        { tier: 'pro', beta: true, unrelated: 1 },
      ),
    ).toEqual({ tier: 'pro', beta: true });
  });
});

describe('buildCustomSettingFileValue', () => {
  it('splits the name into label and extension', () => {
    expect(
      buildCustomSettingFileValue({
        fileId: 'f1',
        fileName: 'customers.export.csv',
        url: 'https://x/f1',
      }),
    ).toEqual({
      fileId: 'f1',
      label: 'customers.export',
      extension: 'csv',
      url: 'https://x/f1',
    });
  });

  it('keeps a name with no extension whole', () => {
    expect(
      buildCustomSettingFileValue({
        fileId: 'f1',
        fileName: 'customers',
        url: 'https://x/f1',
      }),
    ).toEqual({
      fileId: 'f1',
      label: 'customers',
      extension: '',
      url: 'https://x/f1',
    });
  });

  it('prints a name without a trailing dot when there is no extension', () => {
    expect(
      formatCustomSettingFileName({
        fileId: 'f1',
        label: 'customers',
        extension: '',
        url: 'https://x/f1',
      }),
    ).toBe('customers');
  });
});

describe('buildToolRunParams', () => {
  it('parses each tool field the same way a setting would be', () => {
    expect(
      buildToolRunParams(
        [
          { key: 'sourceApp', label: 'Source app', type: 'SELECT', options: ['bon', 'joy'] },
          { key: 'count', label: 'Count', type: 'NUMBER' },
        ],
        { sourceApp: 'bon', count: '7' },
      ),
    ).toEqual({ sourceApp: 'bon', count: 7 });
  });

  it('drops a FILE field the operator never attached', () => {
    expect(
      buildToolRunParams(
        [{ key: 'file', label: 'CSV file', type: 'FILE', required: true }],
        {},
      ),
    ).toEqual({});
  });

  it('keeps a FILE reference as the object it is', () => {
    const file = {
      fileId: 'f1',
      label: 'customers',
      extension: 'csv',
      url: 'https://x/f1',
    };

    expect(
      buildToolRunParams(
        [{ key: 'file', label: 'CSV file', type: 'FILE', required: true }],
        { file },
      ),
    ).toEqual({ file });
  });
});
