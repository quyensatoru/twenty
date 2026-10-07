import { type CodeBlockWriter } from 'ts-morph';

import { type PropertySchema } from '../schemas';

// The schema allows array properties with an itemType, but upstream's split
// of the generator dropped the fork's array rendering and emits raw `array`.
const resolvePropertyTsType = (schema: PropertySchema): string =>
  schema.type === 'array' ? `(${schema.itemType})[]` : schema.type;

export const writePropertyTypeMembers = ({
  writer,
  properties,
}: {
  writer: CodeBlockWriter;
  properties: Record<string, PropertySchema>;
}): void => {
  for (const [propertyName, propertySchema] of Object.entries(properties)) {
    const optionalMarker = propertySchema.optional ? '?' : '';

    writer.writeLine(
      `'${propertyName}'${optionalMarker}: ${resolvePropertyTsType(propertySchema)};`,
    );
  }
};
