import { type EmailBlock } from '../types/email-block';
import { type TemplateVariables } from '../types/template-variables';
import { evaluateTemplateConditions } from './template-condition.util';

export const isEmailBlockVisible = (
  block: EmailBlock,
  variables: TemplateVariables,
): boolean =>
  block.showIf === undefined ||
  block.showIf.length === 0 ||
  evaluateTemplateConditions(block.showIf, variables);
