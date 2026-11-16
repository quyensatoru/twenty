import { defineObject } from 'twenty-sdk/define';

import { PAYMENT_KIND_OPTIONS } from '../constants/select-options';
import {
  BC_PAYMENT_AMOUNT_FIELD_UID,
  BC_PAYMENT_APP_NAME_FIELD_UID,
  BC_PAYMENT_CURRENCY_FIELD_UID,
  BC_PAYMENT_EXTERNAL_ID_FIELD_UID,
  BC_PAYMENT_INVOICE_ID_FIELD_UID,
  BC_PAYMENT_IS_ONE_TIME_FIELD_UID,
  BC_PAYMENT_KIND_FIELD_UID,
  BC_PAYMENT_NAME_FIELD_UID,
  BC_PAYMENT_OBJECT_UID,
  BC_PAYMENT_ORIGINAL_AMOUNT_FIELD_UID,
  BC_PAYMENT_PAID_AT_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  booleanField,
  dateTimeField,
  numberField,
  selectField,
  textField,
} from '../utils/field-builders.util';

// Money actually collected or refunded, pushed by the billing systems. The
// only source of realized lifetime revenue; manager-only.
export default defineObject({
  universalIdentifier: BC_PAYMENT_OBJECT_UID,
  nameSingular: 'bcPayment',
  namePlural: 'bcPayments',
  labelSingular: 'Client Payment',
  labelPlural: 'Client Payments',
  description: 'A collected payment or refund of a VIP client',
  icon: 'IconCash',
  isSearchable: false,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_PAYMENT_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_PAYMENT_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      icon: 'IconCash',
    }),
    textField({
      universalIdentifier: BC_PAYMENT_APP_NAME_FIELD_UID,
      name: 'appName',
      label: 'App',
      icon: 'IconApps',
    }),
    selectField({
      universalIdentifier: BC_PAYMENT_KIND_FIELD_UID,
      name: 'kind',
      label: 'Kind',
      icon: 'IconArrowsExchange',
      options: PAYMENT_KIND_OPTIONS,
      defaultValue: 'CHARGE',
    }),
    numberField({
      universalIdentifier: BC_PAYMENT_AMOUNT_FIELD_UID,
      name: 'amount',
      label: 'Amount',
      description: 'Collected amount net of excluded taxes, in the base currency',
      icon: 'IconCurrencyDollar',
    }),
    numberField({
      universalIdentifier: BC_PAYMENT_ORIGINAL_AMOUNT_FIELD_UID,
      name: 'originalAmount',
      label: 'Original amount',
      icon: 'IconCurrencyDollar',
    }),
    textField({
      universalIdentifier: BC_PAYMENT_CURRENCY_FIELD_UID,
      name: 'currencyCode',
      label: 'Original currency',
      icon: 'IconCurrency',
    }),
    dateTimeField({
      universalIdentifier: BC_PAYMENT_PAID_AT_FIELD_UID,
      name: 'paidAt',
      label: 'Paid at',
      icon: 'IconCalendar',
    }),
    textField({
      universalIdentifier: BC_PAYMENT_INVOICE_ID_FIELD_UID,
      name: 'invoiceId',
      label: 'Invoice',
      icon: 'IconFileInvoice',
    }),
    {
      ...textField({
        universalIdentifier: BC_PAYMENT_EXTERNAL_ID_FIELD_UID,
        name: 'externalId',
        label: 'External ID',
        icon: 'IconKey',
      }),
      isUnique: true,
    },
    booleanField({
      universalIdentifier: BC_PAYMENT_IS_ONE_TIME_FIELD_UID,
      name: 'isOneTime',
      label: 'One-time charge',
      icon: 'IconReceipt',
      defaultValue: false,
    }),
  ],
});
