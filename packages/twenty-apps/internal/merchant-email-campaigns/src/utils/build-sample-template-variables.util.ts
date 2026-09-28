import { TEMPLATE_VARIABLE_DEFINITIONS } from '../constants/template-variable-definitions';
import { type TemplateVariables } from '../types/template-variables';

export const buildSampleTemplateVariables = (): TemplateVariables =>
  Object.fromEntries(
    TEMPLATE_VARIABLE_DEFINITIONS.map(({ key, sample }) => [key, sample]),
  ) as unknown as TemplateVariables;
