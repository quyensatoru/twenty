import { defineObject } from 'twenty-sdk/define';

import { OPPORTUNITY_STATUS_OPTIONS } from '../constants/select-options';
import {
  BC_OPPORTUNITY_APP_NAME_FIELD_UID,
  BC_OPPORTUNITY_BILLING_CYCLE_FIELD_UID,
  BC_OPPORTUNITY_CONVERTED_AT_FIELD_UID,
  BC_OPPORTUNITY_NAME_FIELD_UID,
  BC_OPPORTUNITY_OBJECT_UID,
  BC_OPPORTUNITY_OPPORTUNITY_KEY_FIELD_UID,
  BC_OPPORTUNITY_PLAN_FIELD_UID,
  BC_OPPORTUNITY_STATUS_FIELD_UID,
  BC_OPPORTUNITY_USAGE_LIMIT_FIELD_UID,
  BC_OPPORTUNITY_USAGE_PERCENT_FIELD_UID,
  BC_OPPORTUNITY_USAGE_USED_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  dateTimeField,
  numberField,
  selectField,
  textField,
} from '../utils/field-builders.util';

// One upsell opportunity per client, app, plan and billing cycle: the 80%
// alert and the 100% escalation both point at the same one.
export default defineObject({
  universalIdentifier: BC_OPPORTUNITY_OBJECT_UID,
  nameSingular: 'bcOpportunity',
  namePlural: 'bcOpportunities',
  labelSingular: 'Upsell Opportunity',
  labelPlural: 'Upsell Opportunities',
  description: 'An upsell opportunity raised by plan usage or a BC',
  icon: 'IconTargetArrow',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_OPPORTUNITY_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_OPPORTUNITY_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      icon: 'IconTargetArrow',
      isSearchable: true,
    }),
    textField({
      universalIdentifier: BC_OPPORTUNITY_APP_NAME_FIELD_UID,
      name: 'appName',
      label: 'App',
      icon: 'IconApps',
    }),
    textField({
      universalIdentifier: BC_OPPORTUNITY_PLAN_FIELD_UID,
      name: 'planCode',
      label: 'Plan',
      icon: 'IconCreditCard',
    }),
    textField({
      universalIdentifier: BC_OPPORTUNITY_BILLING_CYCLE_FIELD_UID,
      name: 'billingCycle',
      label: 'Billing cycle',
      icon: 'IconCalendarRepeat',
    }),
    {
      ...textField({
        universalIdentifier: BC_OPPORTUNITY_OPPORTUNITY_KEY_FIELD_UID,
        name: 'opportunityKey',
        label: 'Key',
        icon: 'IconKey',
      }),
      isUnique: true,
    },
    numberField({
      universalIdentifier: BC_OPPORTUNITY_USAGE_PERCENT_FIELD_UID,
      name: 'usagePercent',
      label: 'Usage %',
      icon: 'IconGauge',
    }),
    numberField({
      universalIdentifier: BC_OPPORTUNITY_USAGE_USED_FIELD_UID,
      name: 'usageUsed',
      label: 'Used',
      icon: 'IconGauge',
    }),
    numberField({
      universalIdentifier: BC_OPPORTUNITY_USAGE_LIMIT_FIELD_UID,
      name: 'usageLimit',
      label: 'Allowance',
      icon: 'IconGauge',
    }),
    selectField({
      universalIdentifier: BC_OPPORTUNITY_STATUS_FIELD_UID,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      options: OPPORTUNITY_STATUS_OPTIONS,
      defaultValue: 'OPEN',
    }),
    dateTimeField({
      universalIdentifier: BC_OPPORTUNITY_CONVERTED_AT_FIELD_UID,
      name: 'convertedAt',
      label: 'Converted at',
      icon: 'IconCircleCheck',
    }),
  ],
});
