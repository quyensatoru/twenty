export type TranslationValues = Record<string, string | number>;

export type Translate = (message: string, values?: TranslationValues) => string;

export const interpolate = (
  message: string,
  values?: TranslationValues,
): string =>
  message.replace(/\{(\w+)\}/g, (match, key: string) =>
    values?.[key] === undefined ? match : String(values[key]),
  );

export const createCatalogTranslate =
  (catalog: Record<string, unknown> | null): Translate =>
  (message, values) => {
    const translated = catalog?.[message];

    return interpolate(
      typeof translated === 'string' && translated.length > 0
        ? translated
        : message,
      values,
    );
  };
