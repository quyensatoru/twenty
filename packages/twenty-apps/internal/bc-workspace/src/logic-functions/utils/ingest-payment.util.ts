import { type ApiClient } from '../../types/api-client';
import { type BcPaymentRecord, type VipClientRecord } from '../../types/bc-records';
import { type IngestPaymentBody } from '../../types/ingest';
import {
  requireIngestDate,
  requireIngestNumber,
  requireIngestString,
} from './ingest-route.util';
import { readBcSettings } from './read-bc-settings.util';
import { createRecord, findFirstRecord } from './record-store.util';

// Collected money only, already net of excluded taxes; the CRM never converts
// currencies itself, so a foreign amount must come with its base value.
export const ingestPayment = async ({
  client,
  body,
  vipClient,
}: {
  client: ApiClient;
  body: IngestPaymentBody;
  vipClient: VipClientRecord;
}): Promise<Record<string, unknown>> => {
  const paymentId = requireIngestString(body.paymentId, 'paymentId');
  const kind = body.kind === 'REFUND' ? 'REFUND' : body.kind === 'CHARGE' ? 'CHARGE' : null;

  if (kind === null) {
    throw new Error('Invalid kind: expected CHARGE or REFUND.');
  }

  const originalAmount = Math.abs(requireIngestNumber(body.amount, 'amount'));
  const currency = requireIngestString(body.currency, 'currency').toUpperCase();
  const paidAt = requireIngestDate(body.paidAt, 'paidAt');
  const { baseCurrency } = readBcSettings();
  const amount =
    currency === baseCurrency.toUpperCase()
      ? originalAmount
      : Math.abs(requireIngestNumber(body.amountInBaseCurrency, 'amountInBaseCurrency'));

  const existing = await findFirstRecord<BcPaymentRecord>({
    client,
    objectNamePlural: 'bcPayments',
    filter: { externalId: { eq: paymentId } },
    selection: { id: true },
  });

  if (existing !== null) {
    return { paymentId: existing.id, isNew: false };
  }

  const payment = await createRecord<BcPaymentRecord>({
    client,
    objectNameSingular: 'bcPayment',
    data: {
      name: body.invoiceId ?? paymentId,
      appName: typeof body.appName === 'string' ? body.appName.toUpperCase() : null,
      kind,
      amount,
      originalAmount,
      currencyCode: currency,
      paidAt,
      invoiceId: body.invoiceId ?? null,
      externalId: paymentId,
      isOneTime: body.isOneTime === true,
      vipClientId: vipClient.id,
    },
    selection: { id: true },
  });

  return { paymentId: payment.id, isNew: true };
};
