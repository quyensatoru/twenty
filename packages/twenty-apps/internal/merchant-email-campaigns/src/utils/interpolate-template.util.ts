import { type TemplateVariables } from '../types/template-variables';
import { evaluateTemplateExpression } from './evaluate-template-expression.util';
import { renderTemplateSections } from './template-sections.util';

const VARIABLE_PATTERN =
  /\{\{\s*(?![#/]|else\s*\}\})([^{}|]+?)\s*(?:\|([^}]*))?\}\}/g;

const renderExpression = (
  expression: string,
  variables: TemplateVariables,
): string => {
  const value = evaluateTemplateExpression(expression, variables);

  switch (value.kind) {
    case 'NUMBER':
      return String(Math.max(0, value.value));
    case 'TEXT':
      return value.value;
    default:
      return '';
  }
};

// `{{name}}`, `{{name|fallback}}`, `{{event.key}}`, `{{daysSince installedAt}}`
// and `{{#if ...}}...{{else}}...{{/if}}`. Unknown names render as empty rather
// than leaking the raw placeholder into a customer's inbox.
export const interpolateTemplate = (
  template: string,
  variables: TemplateVariables,
  transformValue: (value: string) => string = (value) => value,
): string => {
  if (variables.preserveTokens === true) {
    return template;
  }

  return renderTemplateSections(template, variables).replace(
    VARIABLE_PATTERN,
    (_match, expression: string, fallback) => {
      const value = renderExpression(expression, variables);
      const resolved = value.trim() !== '' ? value : (fallback ?? '').trim();

      return transformValue(resolved);
    },
  );
};
