import { defineObject } from 'twenty-sdk/define';

import {
  BC_PLAN_APP_NAME_FIELD_UID,
  BC_PLAN_IS_TRIAL_FIELD_UID,
  BC_PLAN_MONTHLY_PRICE_FIELD_UID,
  BC_PLAN_NAME_FIELD_UID,
  BC_PLAN_OBJECT_UID,
  BC_PLAN_PLAN_CODE_FIELD_UID,
  BC_PLAN_RANK_FIELD_UID,
  BC_PLAN_USAGE_ALLOWANCE_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  booleanField,
  numberField,
  textField,
} from '../utils/field-builders.util';

// Per-app plan catalog: tells an upgrade from a downgrade, prices MRR and
// holds the usage allowance the 80% / 100% upsell rule compares against.
export default defineObject({
  universalIdentifier: BC_PLAN_OBJECT_UID,
  nameSingular: 'bcPlan',
  namePlural: 'bcPlans',
  labelSingular: 'App Plan',
  labelPlural: 'App Plans',
  description: 'A plan of an app with its monthly price, rank and allowance',
  icon: 'IconCreditCard',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_PLAN_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_PLAN_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      icon: 'IconCreditCard',
      isSearchable: true,
    }),
    textField({
      universalIdentifier: BC_PLAN_APP_NAME_FIELD_UID,
      name: 'appName',
      label: 'App',
      icon: 'IconApps',
    }),
    textField({
      universalIdentifier: BC_PLAN_PLAN_CODE_FIELD_UID,
      name: 'planCode',
      label: 'Plan code',
      description: 'Value of the merchant pricing plan, e.g. GROWTH',
      icon: 'IconKey',
    }),
    numberField({
      universalIdentifier: BC_PLAN_MONTHLY_PRICE_FIELD_UID,
      name: 'monthlyPrice',
      label: 'Monthly price',
      icon: 'IconCurrencyDollar',
    }),
    numberField({
      universalIdentifier: BC_PLAN_RANK_FIELD_UID,
      name: 'rank',
      label: 'Rank',
      description: 'Higher is a bigger plan',
      icon: 'IconSortAscending',
    }),
    numberField({
      universalIdentifier: BC_PLAN_USAGE_ALLOWANCE_FIELD_UID,
      name: 'usageAllowance',
      label: 'Usage allowance',
      description: 'Monthly orders or feature units included in the plan',
      icon: 'IconGauge',
    }),
    booleanField({
      universalIdentifier: BC_PLAN_IS_TRIAL_FIELD_UID,
      name: 'isTrial',
      label: 'Trial plan',
      description: 'Subscriptions on this plan show as Trial',
      icon: 'IconHourglass',
      defaultValue: false,
    }),
  ],
});
