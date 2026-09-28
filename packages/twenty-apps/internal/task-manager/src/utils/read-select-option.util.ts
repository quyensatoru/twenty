type SelectOption = {
  value: string;
  label: string;
  color: string;
};

// The options live in src/constants and are shipped to the host as field
// metadata; a front component cannot read that metadata back, so it looks the
// label and colour up in the same source the object definition uses.
export const readSelectOption = (
  options: readonly SelectOption[],
  value: string | null | undefined,
): SelectOption | undefined =>
  typeof value === 'string'
    ? options.find((option) => option.value === value)
    : undefined;
