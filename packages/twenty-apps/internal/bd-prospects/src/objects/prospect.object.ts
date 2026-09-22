import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  buildStageOptionsForApp,
  OUR_APPS_OPTIONS,
  SELLABLE_APPS,
} from '../constants/registered-apps';
import { SHOPIFY_PLAN_OPTIONS } from '../constants/shopify-plans';
import {
  PROSPECT_OTHER_APPS_FIELD_UID,
  PROSPECT_OUR_APPS_FIELD_UID,
  PROSPECT_EMAIL_FIELD_UID,
  PROSPECT_DOMAIN_FIELD_UID,
  PROSPECT_IMPORTED_AT_FIELD_UID,
  PROSPECT_INDUSTRY_FIELD_UID,
  PROSPECT_LAST_SYNCED_AT_FIELD_UID,
  PROSPECT_OBJECT_UID,
  PROSPECT_SHOP_NAME_FIELD_UID,
  PROSPECT_SHOPIFY_PLAN_FIELD_UID,
} from '../constants/universal-identifiers';

// One row per shop domain, deliberately NOT related to `app` or `merchant` by a
// MANY_TO_ONE edge: any such edge would put this object inside the workspace's
// app-scope enforcement, where a row with no app is hidden from every narrow
// role. BD needs to see shops coming from apps this workspace does not know
// about, so the app a shop uses is carried as plain text in `appsUsed` instead.
export default defineObject({
  universalIdentifier: PROSPECT_OBJECT_UID,
  nameSingular: 'prospect',
  namePlural: 'prospects',
  labelSingular: 'Prospect',
  labelPlural: 'Prospects',
  description:
    'A shop tracked by the BD team for cross-app upsell, keyed by its domain',
  icon: 'IconTargetArrow',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: PROSPECT_DOMAIN_FIELD_UID,
  fields: [
    {
      universalIdentifier: PROSPECT_DOMAIN_FIELD_UID,
      type: FieldType.TEXT,
      name: 'domain',
      label: 'Domain',
      description: 'Normalised shop domain, e.g. abc.myshopify.com',
      icon: 'IconWorld',
      isUnique: true,
    },
    {
      universalIdentifier: PROSPECT_SHOP_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'shopName',
      label: 'Shop name',
      icon: 'IconBuildingStore',
    },
    {
      universalIdentifier: PROSPECT_EMAIL_FIELD_UID,
      type: FieldType.EMAILS,
      name: 'email',
      label: 'Email',
      description: 'Contact address BD reaches out to',
      icon: 'IconMail',
      isNullable: true,
    },
    {
      universalIdentifier: PROSPECT_SHOPIFY_PLAN_FIELD_UID,
      type: FieldType.SELECT,
      name: 'shopifyPlan',
      label: 'Shopify plan',
      icon: 'IconCreditCard',
      isNullable: true,
      options: [...SHOPIFY_PLAN_OPTIONS],
    },
    {
      universalIdentifier: PROSPECT_OUR_APPS_FIELD_UID,
      type: FieldType.MULTI_SELECT,
      name: 'ourApps',
      label: 'Our apps',
      description:
        'Apps of ours this shop already runs. Drives the upsell-candidate filter: candidates for app X are shops without X here.',
      icon: 'IconApps',
      isNullable: true,
      options: OUR_APPS_OPTIONS,
    },
    {
      universalIdentifier: PROSPECT_OTHER_APPS_FIELD_UID,
      type: FieldType.ARRAY,
      name: 'otherApps',
      label: 'Other apps',
      description:
        'Every other app this shop runs, by name, whether or not we know it. Free text on purpose: a new source app must never be dropped or block an import just because nobody declared it.',
      icon: 'IconAppsUsed',
      isNullable: true,
    },
    {
      universalIdentifier: PROSPECT_INDUSTRY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'industry',
      label: 'Industry',
      icon: 'IconCategory',
    },
    {
      universalIdentifier: PROSPECT_LAST_SYNCED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'lastSyncedAt',
      label: 'Last synced at',
      description: 'Last time the merchant sync refreshed this row',
      icon: 'IconRefresh',
      isNullable: true,
    },
    {
      universalIdentifier: PROSPECT_IMPORTED_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'importedAt',
      label: 'Imported at',
      description: 'Last time this row was touched by a manual CSV import',
      icon: 'IconFileImport',
      isNullable: true,
    },
    // One stage column per app this team sells, not per app a shop runs: a
    // prospect can run several deals at once and a single combined column
    // cannot be read or filtered per app. Written by
    // refresh-prospect-deal-stages, never by hand.
    // `as const` on the type keeps the discriminated union happy: a mapped
    // object widens it to FieldType otherwise, and no member of the field
    // manifest union matches that.
    ...SELLABLE_APPS.map((app) => ({
      universalIdentifier: app.stage.fieldUniversalIdentifier,
      type: FieldType.SELECT as const,
      name: app.stage.name,
      label: app.stage.label,
      description: `Stage of the open deal selling ${app.label} to this shop`,
      icon: 'IconProgress',
      isNullable: true as const,
      options: buildStageOptionsForApp(app),
    })),
  ],
});
