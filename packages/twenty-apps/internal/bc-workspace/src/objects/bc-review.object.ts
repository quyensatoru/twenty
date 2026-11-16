import { defineObject } from 'twenty-sdk/define';

import { RECORD_SOURCE_OPTIONS } from '../constants/select-options';
import {
  BC_REVIEW_APP_NAME_FIELD_UID,
  BC_REVIEW_BODY_FIELD_UID,
  BC_REVIEW_CREDITED_MEMBER_ID_FIELD_UID,
  BC_REVIEW_EVIDENCE_ACTIVITY_ID_FIELD_UID,
  BC_REVIEW_EXTERNAL_ID_FIELD_UID,
  BC_REVIEW_IS_VERIFIED_FIELD_UID,
  BC_REVIEW_NAME_FIELD_UID,
  BC_REVIEW_OBJECT_UID,
  BC_REVIEW_PUBLISHED_AT_FIELD_UID,
  BC_REVIEW_RATING_FIELD_UID,
  BC_REVIEW_REVIEW_URL_FIELD_UID,
  BC_REVIEW_SOURCE_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  booleanField,
  dateTimeField,
  numberField,
  selectField,
  textField,
  uuidField,
} from '../utils/field-builders.util';

// One published Shopify App Store review per client and app. It is credited
// to a BC only when a BC outreach happened before it was published.
export default defineObject({
  universalIdentifier: BC_REVIEW_OBJECT_UID,
  nameSingular: 'bcReview',
  namePlural: 'bcReviews',
  labelSingular: 'App Review',
  labelPlural: 'App Reviews',
  description: 'A Shopify App Store review left by a VIP client',
  icon: 'IconStar',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_REVIEW_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_REVIEW_NAME_FIELD_UID,
      name: 'name',
      label: 'Reviewer',
      icon: 'IconStar',
      isSearchable: true,
    }),
    textField({
      universalIdentifier: BC_REVIEW_APP_NAME_FIELD_UID,
      name: 'appName',
      label: 'App',
      icon: 'IconApps',
    }),
    numberField({
      universalIdentifier: BC_REVIEW_RATING_FIELD_UID,
      name: 'rating',
      label: 'Rating',
      icon: 'IconStar',
    }),
    textField({
      universalIdentifier: BC_REVIEW_BODY_FIELD_UID,
      name: 'body',
      label: 'Review text',
      icon: 'IconQuote',
    }),
    dateTimeField({
      universalIdentifier: BC_REVIEW_PUBLISHED_AT_FIELD_UID,
      name: 'publishedAt',
      label: 'Published at',
      icon: 'IconCalendar',
    }),
    textField({
      universalIdentifier: BC_REVIEW_REVIEW_URL_FIELD_UID,
      name: 'reviewUrl',
      label: 'Shopify review link',
      description: 'Direct link to this review, never the app listing',
      icon: 'IconLink',
    }),
    booleanField({
      universalIdentifier: BC_REVIEW_IS_VERIFIED_FIELD_UID,
      name: 'isVerified',
      label: 'Verified',
      icon: 'IconRosetteDiscountCheck',
      defaultValue: false,
    }),
    uuidField({
      universalIdentifier: BC_REVIEW_CREDITED_MEMBER_ID_FIELD_UID,
      name: 'creditedMemberId',
      label: 'Credited BC',
      icon: 'IconUser',
    }),
    uuidField({
      universalIdentifier: BC_REVIEW_EVIDENCE_ACTIVITY_ID_FIELD_UID,
      name: 'evidenceActivityId',
      label: 'Outreach evidence',
      description: 'BC activity before publication that earns the credit',
      icon: 'IconFileSearch',
    }),
    {
      ...textField({
        universalIdentifier: BC_REVIEW_EXTERNAL_ID_FIELD_UID,
        name: 'externalId',
        label: 'External ID',
        icon: 'IconKey',
      }),
      isUnique: true,
    },
    selectField({
      universalIdentifier: BC_REVIEW_SOURCE_FIELD_UID,
      name: 'source',
      label: 'Source',
      icon: 'IconPlug',
      options: RECORD_SOURCE_OPTIONS,
      defaultValue: 'MANUAL',
    }),
  ],
});
