// Wraps `twenty dev:translations-extract`, which only reads the front
// component entry files and drops every other key from the locale catalogs.
// This script keeps the SDK's metadata strings (object, field, view labels)
// and adds the strings of every file under src/, keeping translations that
// already exist.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const appPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
);
const localesDir = path.join(appPath, 'locales');
const sourceLocale = 'en';

const listFiles = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      return entry === '__tests__' ? [] : listFiles(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });

const readCatalogs = () =>
  Object.fromEntries(
    readdirSync(localesDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => [
        path.basename(file, '.json'),
        JSON.parse(readFileSync(path.join(localesDir, file), 'utf8')),
      ]),
  );

const unescape = (value) =>
  value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');

// t('...') anywhere, `label: '...'` in option lists, the values of the label
// maps, and the static messages the server sends back to the studio.
const PATTERNS = [
  /\bt\(\s*'((?:[^'\\]|\\.)*)'/g,
  /\blabel: '((?:[^'\\]|\\.)*)'/g,
  /\b(?:error|reason): '((?:[^'\\]|\\.)*)'/g,
  /\bfail\(\s*'((?:[^'\\]|\\.)*)'/g,
  /new Error\(\s*'((?:[^'\\]|\\.)*)'/g,
];
const LABEL_MAP_FILES = new Set([
  'block-type-labels.ts',
  'send-status-labels.ts',
  'provider-labels.ts',
]);
const LABEL_MAP_PATTERN = /^\s+[A-Z_a-z]+: '((?:[^'\\]|\\.)*)',$/gm;

const collectSourceStrings = () => {
  const strings = new Set();

  for (const file of listFiles(path.join(appPath, 'src'))) {
    const content = readFileSync(file, 'utf8');
    const patterns = LABEL_MAP_FILES.has(path.basename(file))
      ? [...PATTERNS, LABEL_MAP_PATTERN]
      : PATTERNS;

    for (const pattern of patterns) {
      for (const match of content.matchAll(pattern)) {
        const message = unescape(match[1]).trim();

        if (message !== '' && /[a-z]/.test(message)) {
          strings.add(message);
        }
      }
    }
  }

  return strings;
};

const previousCatalogs = readCatalogs();

execFileSync('yarn', ['twenty', 'dev:translations-extract'], {
  cwd: appPath,
  stdio: 'inherit',
});

const sdkCatalogs = readCatalogs();
const sourceStrings = collectSourceStrings();

const mergeCatalog = (locale) => {
  const catalog = { ...sdkCatalogs[locale] };
  const previous = previousCatalogs[locale] ?? {};

  for (const [key, value] of Object.entries(previous)) {
    if (typeof value === 'string' && catalog[key] === '') {
      catalog[key] = value;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      typeof catalog[key] === 'object'
    ) {
      for (const [message, translation] of Object.entries(value)) {
        if (catalog[key][message] === '' && typeof translation === 'string') {
          catalog[key][message] = translation;
        }
      }
    }
  }

  for (const message of sourceStrings) {
    if (typeof catalog[message] !== 'string') {
      catalog[message] =
        locale === sourceLocale
          ? message
          : typeof previous[message] === 'string'
            ? previous[message]
            : '';
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(catalog).sort(
      ([left, leftValue], [right, rightValue]) =>
        (typeof leftValue === 'object') - (typeof rightValue === 'object') ||
        left.localeCompare(right),
    ),
  );

  writeFileSync(
    path.join(localesDir, `${locale}.json`),
    `${JSON.stringify(sorted, null, 2)}\n`,
  );

  return Object.values(sorted)
    .flatMap((value) =>
      typeof value === 'object' ? Object.values(value) : [value],
    )
    .filter((value) => value === '').length;
};

for (const locale of Object.keys(sdkCatalogs)) {
  const missing = mergeCatalog(locale);

  console.log(
    `${locale}: ${missing === 0 ? 'complete' : `${missing} missing`}`,
  );
}
