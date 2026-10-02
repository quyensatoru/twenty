import { z } from 'zod';

export const PropertySchemaZ = z
  .object({
    type: z.enum(['string', 'number', 'boolean', 'array']),
    itemType: z.string().min(1).optional(),
    optional: z.boolean(),
  })
  .refine(
    (schema) => schema.type !== 'array' || schema.itemType !== undefined,
    { message: "An 'array' property must declare its itemType" },
  );

export const HtmlElementConfigZ = z.object({
  tag: z.string().regex(/^html-[a-z0-9]+$/, 'Tag must start with "html-"'),
  name: z
    .string()
    .regex(/^Html[A-Z]/, 'Name must be PascalCase starting with Html'),
  properties: z.record(z.string(), PropertySchemaZ),
  events: z.array(z.string()).optional(),
  htmlTag: z.string().optional(),
});

export const HtmlElementConfigArrayZ = z.array(HtmlElementConfigZ);

export const UtilityComponentElementConfigZ = z.object({
  tag: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)+$/,
      'Tag must be a valid custom element name',
    ),
  name: z.string().regex(/^[A-Z]/, 'Name must be PascalCase'),
  properties: z.record(z.string(), PropertySchemaZ),
  events: z.array(z.string()),
  hostRendererName: z.string().min(1),
  hostRendererPath: z.string().min(1),
  isExposedToFrontComponentJsx: z.boolean(),
});

export const UtilityComponentElementConfigArrayZ = z.array(
  UtilityComponentElementConfigZ,
);

export const ComponentSchemaZ = z.object({
  name: z.string().min(1),
  customElementName: z.string().min(1),
  properties: z.record(z.string(), PropertySchemaZ),
  events: z.array(z.string()).readonly(),
  htmlTag: z.string().optional(),
  customHostRenderer: z.string().optional(),
  customHostRendererPath: z.string().optional(),
});

export type PropertySchema = z.infer<typeof PropertySchemaZ>;
export type HtmlElementConfig = z.infer<typeof HtmlElementConfigZ>;
export type UtilityComponentElementConfig = z.infer<
  typeof UtilityComponentElementConfigZ
>;
export type ComponentSchema = z.infer<typeof ComponentSchemaZ>;
