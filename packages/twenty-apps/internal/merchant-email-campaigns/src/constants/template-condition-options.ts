export const CUSTOM_CONDITION_VALUE = 'CUSTOM';

export const TEMPLATE_CONDITION_VALUE_OPTIONS: {
  value: string;
  label: string;
  isNumber: boolean;
}[] = [
  {
    value: 'daysSince installedAt',
    label: 'Days since install',
    isNumber: true,
  },
  {
    value: 'daysUntil installedAt+14d',
    label: 'Days until trial ends (14d)',
    isNumber: true,
  },
  {
    value: 'daysSince uninstalledAt',
    label: 'Days since uninstall',
    isNumber: true,
  },
  {
    value: 'daysSince addedToCrmAt',
    label: 'Days since added to CRM',
    isNumber: true,
  },
  { value: 'pricingPlan', label: 'Pricing plan', isNumber: false },
  { value: 'shopifyPlan', label: 'Shopify plan', isNumber: false },
  { value: 'country', label: 'Country', isNumber: false },
  { value: 'installStatus', label: 'Install status', isNumber: false },
  { value: 'appName', label: 'App name', isNumber: false },
];

// What the author picks; IS_SET / IS_EMPTY are stored as != '' / = ''.
export type TemplateConditionChoice =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'IS_SET'
  | 'IS_EMPTY';

export const TEMPLATE_CONDITION_CHOICE_OPTIONS: {
  value: TemplateConditionChoice;
  label: string;
  isNumberOnly: boolean;
}[] = [
  { value: '=', label: 'equals', isNumberOnly: false },
  { value: '!=', label: 'is not', isNumberOnly: false },
  { value: '>', label: 'greater than', isNumberOnly: true },
  { value: '>=', label: 'at least', isNumberOnly: true },
  { value: '<', label: 'less than', isNumberOnly: true },
  { value: '<=', label: 'at most', isNumberOnly: true },
  { value: 'IS_SET', label: 'is set', isNumberOnly: false },
  { value: 'IS_EMPTY', label: 'is empty', isNumberOnly: false },
];
