import {
  type TemplateCondition,
  type TemplateConditionOperator,
} from '../types/template-condition';
import { type TemplateVariables } from '../types/template-variables';
import {
  evaluateTemplateExpression,
  isValidTemplateExpression,
} from './evaluate-template-expression.util';

export const TEMPLATE_CONDITION_OPERATORS: TemplateConditionOperator[] = [
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
];

const CONDITION_PATTERN = /^(.+?)\s*(>=|<=|!=|=|>|<)\s*(.*)$/;

// HTML editors and the block-to-HTML conversion escape `<`, `>` and quotes.
const decodeEntities = (text: string): string =>
  text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const unquote = (value: string): string => {
  const trimmed = value.trim();

  return /^(".*"|'.*')$/.test(trimmed) ? trimmed.slice(1, -1) : trimmed;
};

export const isTemplateConditionValid = (condition: TemplateCondition) =>
  TEMPLATE_CONDITION_OPERATORS.includes(condition.operator) &&
  isValidTemplateExpression(condition.value);

// `a = b and c` ; a bare expression means "is set".
export const parseTemplateConditionText = (
  text: string,
): TemplateCondition[] | null => {
  const parts = decodeEntities(text)
    .trim()
    .split(/\s+and\s+/i);

  if (parts.length === 0 || parts.some((part) => part.trim() === '')) {
    return null;
  }

  const conditions = parts.map((part): TemplateCondition => {
    const match = part.trim().match(CONDITION_PATTERN);

    return match === null
      ? { value: part.trim(), operator: '!=', compareTo: '' }
      : {
          value: match[1].trim(),
          operator: match[2] as TemplateConditionOperator,
          compareTo: unquote(match[3]),
        };
  });

  return conditions.every(isTemplateConditionValid) ? conditions : null;
};

export const serializeTemplateConditions = (
  conditions: TemplateCondition[],
): string =>
  conditions
    .map(({ value, operator, compareTo }) =>
      compareTo === '' || /\s/.test(compareTo)
        ? `${value} ${operator} "${compareTo}"`
        : `${value} ${operator} ${compareTo}`,
    )
    .join(' and ');

const compareNumbers = (
  left: number,
  operator: TemplateConditionOperator,
  right: number,
): boolean => {
  switch (operator) {
    case '=':
      return left === right;
    case '!=':
      return left !== right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
  }
};

const readNumber = (value: string): number | null => {
  const trimmed = value.trim();
  const parsed = Number(trimmed);

  return trimmed !== '' && Number.isFinite(parsed) ? parsed : null;
};

// Anything it cannot read is false, so a typo hides content rather than
// sending it to everyone.
export const evaluateTemplateCondition = (
  condition: TemplateCondition,
  variables: TemplateVariables,
): boolean => {
  if (!isTemplateConditionValid(condition)) {
    return false;
  }

  const { operator } = condition;
  const compareTo = condition.compareTo.trim();
  const left = evaluateTemplateExpression(condition.value, variables);

  switch (left.kind) {
    case 'INVALID':
      return false;
    case 'MISSING':
      return compareTo === '' && operator === '=';
    case 'NUMBER': {
      if (compareTo === '') {
        return operator === '!=';
      }

      const right = readNumber(compareTo);

      return right !== null && compareNumbers(left.value, operator, right);
    }
    case 'TEXT': {
      const value = left.value.trim();

      if (operator === '=' || operator === '!=') {
        const isEqual = value.toLowerCase() === compareTo.toLowerCase();

        return operator === '=' ? isEqual : !isEqual;
      }

      const leftNumber = readNumber(value);
      const rightNumber = readNumber(compareTo);

      return (
        leftNumber !== null &&
        rightNumber !== null &&
        compareNumbers(leftNumber, operator, rightNumber)
      );
    }
  }
};

export const evaluateTemplateConditions = (
  conditions: TemplateCondition[],
  variables: TemplateVariables,
): boolean =>
  conditions.every((condition) =>
    evaluateTemplateCondition(condition, variables),
  );
