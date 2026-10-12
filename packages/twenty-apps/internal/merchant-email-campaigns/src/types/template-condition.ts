export type TemplateConditionOperator = '=' | '!=' | '>' | '>=' | '<' | '<=';

// `value` is a template expression (`pricingPlan`, `daysSince installedAt`,
// `event.coupon`); comparing to '' tests whether it is empty or set.
export type TemplateCondition = {
  value: string;
  operator: TemplateConditionOperator;
  compareTo: string;
};
