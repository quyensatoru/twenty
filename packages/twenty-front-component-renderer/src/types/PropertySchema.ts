export type PropertySchema = {
  type: 'string' | 'number' | 'boolean' | 'array';
  // Only meaningful for 'array': the generated declaration is what app authors
  // type against, and `Array` on its own says nothing about what is in it.
  itemType?: string;
  optional: boolean;
};
