import { FieldType } from 'twenty-sdk/define';

type FieldBase = {
  universalIdentifier: string;
  name: string;
  label: string;
  icon: string;
  description?: string;
};

type SelectOption = {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly position: number;
  readonly color: string;
};

export const textField = (base: FieldBase & { isSearchable?: boolean }) => ({
  ...base,
  type: FieldType.TEXT as const,
  isNullable: true as const,
});

export const numberField = (base: FieldBase) => ({
  ...base,
  type: FieldType.NUMBER as const,
  isNullable: true as const,
});

export const dateTimeField = (base: FieldBase) => ({
  ...base,
  type: FieldType.DATE_TIME as const,
  isNullable: true as const,
});

export const booleanField = (base: FieldBase & { defaultValue: boolean }) => ({
  ...base,
  type: FieldType.BOOLEAN as const,
  isNullable: false as const,
});

export const uuidField = (base: FieldBase) => ({
  ...base,
  type: FieldType.UUID as const,
  isNullable: true as const,
});

export const rawJsonField = (base: FieldBase) => ({
  ...base,
  type: FieldType.RAW_JSON as const,
  isNullable: true as const,
});

export const arrayField = (base: FieldBase) => ({
  ...base,
  type: FieldType.ARRAY as const,
  isNullable: true as const,
});

export const selectField = <TOption extends SelectOption>(
  base: FieldBase & {
    options: readonly TOption[];
    defaultValue?: TOption['value'];
  },
) => {
  const { options, defaultValue, ...rest } = base;

  return {
    ...rest,
    type: FieldType.SELECT as const,
    options: options.map((option) => ({ ...option })),
    ...(defaultValue === undefined
      ? { isNullable: true as const }
      : { isNullable: false as const, defaultValue: `'${defaultValue}'` }),
  };
};
