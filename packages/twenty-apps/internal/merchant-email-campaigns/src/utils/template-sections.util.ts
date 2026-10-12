import { type TemplateCondition } from '../types/template-condition';
import { type TemplateVariables } from '../types/template-variables';
import { isValidTemplateExpression } from './evaluate-template-expression.util';
import {
  evaluateTemplateConditions,
  parseTemplateConditionText,
} from './template-condition.util';

type SectionNode =
  | { kind: 'TEXT'; text: string }
  | {
      kind: 'IF';
      conditions: TemplateCondition[];
      whenTrue: SectionNode[];
      whenFalse: SectionNode[];
    };

type OpenSection = {
  conditions: TemplateCondition[];
  whenTrue: SectionNode[];
  whenFalse: SectionNode[];
  isInElse: boolean;
};

type ParseResult =
  | { ok: true; nodes: SectionNode[] }
  | { ok: false; error: string };

const CONTROL_PATTERN = /\{\{\s*(#if\b([^}]*)|else|\/if)\s*\}\}/g;
const DATE_FUNCTION_TOKEN_PATTERN =
  /\{\{\s*((?:daysSince|daysUntil|date)\b[^}|]*)(?:\|[^}]*)?\}\}/g;

const parseSections = (template: string): ParseResult => {
  const root: SectionNode[] = [];
  const stack: OpenSection[] = [];
  let cursor = 0;

  const currentNodes = (): SectionNode[] => {
    const open = stack[stack.length - 1];

    if (open === undefined) {
      return root;
    }

    return open.isInElse ? open.whenFalse : open.whenTrue;
  };

  for (const match of template.matchAll(CONTROL_PATTERN)) {
    const index = match.index ?? 0;

    if (index > cursor) {
      currentNodes().push({
        kind: 'TEXT',
        text: template.slice(cursor, index),
      });
    }

    cursor = index + match[0].length;

    const tag = match[1];

    if (tag.startsWith('#if')) {
      const conditionText = match[2]?.trim() ?? '';
      const conditions = parseTemplateConditionText(conditionText);

      if (conditions === null) {
        return {
          ok: false,
          error:
            conditionText === ''
              ? '{{#if}} needs a condition'
              : `Cannot read the condition "${conditionText}"`,
        };
      }

      stack.push({ conditions, whenTrue: [], whenFalse: [], isInElse: false });
      continue;
    }

    const open = stack[stack.length - 1];

    if (tag === 'else') {
      if (open === undefined) {
        return { ok: false, error: '{{else}} without a matching {{#if}}' };
      }

      if (open.isInElse) {
        return { ok: false, error: 'Two {{else}} in the same {{#if}}' };
      }

      open.isInElse = true;
      continue;
    }

    if (open === undefined) {
      return { ok: false, error: '{{/if}} without a matching {{#if}}' };
    }

    stack.pop();
    currentNodes().push({
      kind: 'IF',
      conditions: open.conditions,
      whenTrue: open.whenTrue,
      whenFalse: open.whenFalse,
    });
  }

  if (stack.length > 0) {
    return { ok: false, error: '{{#if}} is never closed with {{/if}}' };
  }

  if (cursor < template.length) {
    root.push({ kind: 'TEXT', text: template.slice(cursor) });
  }

  return { ok: true, nodes: root };
};

const renderNodes = (
  nodes: SectionNode[],
  variables: TemplateVariables,
): string =>
  nodes
    .map((node) => {
      if (node.kind === 'TEXT') {
        return node.text;
      }

      return renderNodes(
        evaluateTemplateConditions(node.conditions, variables)
          ? node.whenTrue
          : node.whenFalse,
        variables,
      );
    })
    .join('');

// Never throws: a broken template still previews (control tags dropped,
// every branch shown) while findTemplateTextError reports it and the send
// path refuses it.
export const renderTemplateSections = (
  template: string,
  variables: TemplateVariables,
): string => {
  if (!template.includes('{{')) {
    return template;
  }

  const parsed = parseSections(template);

  return parsed.ok
    ? renderNodes(parsed.nodes, variables)
    : template.replace(CONTROL_PATTERN, '');
};

export const findTemplateTextError = (template: string): string | null => {
  if (!template.includes('{{')) {
    return null;
  }

  const parsed = parseSections(template);

  if (!parsed.ok) {
    return parsed.error;
  }

  for (const match of template.matchAll(DATE_FUNCTION_TOKEN_PATTERN)) {
    if (!isValidTemplateExpression(match[1])) {
      return `Cannot read "{{${match[1].trim()}}}"`;
    }
  }

  return null;
};
