import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  buildDeliveryPayload,
  interpretAppResponse,
  isValidDeliverySignature,
  readAppErrors,
  signDeliveryBody,
} from '../discount-delivery.util';

describe('signDeliveryBody', () => {
  it("signs like Twenty's web hook: hex HMAC of timestamp:body", () => {
    const body = JSON.stringify({ eventName: 'discount.created' });

    expect(
      signDeliveryBody({ secret: 'secret', timestamp: '1700', body }),
    ).toBe(createHmac('sha256', 'secret').update(`1700:${body}`).digest('hex'));
  });

  it('accepts its own signature and refuses another or a missing secret', () => {
    const signature = signDeliveryBody({
      secret: 'secret',
      timestamp: '1700',
      body: '{}',
    });

    expect(
      isValidDeliverySignature({
        secret: 'secret',
        timestamp: '1700',
        body: '{}',
        signature,
      }),
    ).toBe(true);
    expect(
      isValidDeliverySignature({
        secret: 'other',
        timestamp: '1700',
        body: '{}',
        signature,
      }),
    ).toBe(false);
    expect(
      isValidDeliverySignature({
        secret: '',
        timestamp: '1700',
        body: '{}',
        signature,
      }),
    ).toBe(false);
  });
});

describe('interpretAppResponse', () => {
  it('treats a plain 2xx as applied, as the current app servers answer', () => {
    expect(interpretAppResponse(200, { ok: true })).toMatchObject({
      result: 'APPLIED',
      externalId: null,
      isRetryable: false,
    });
    expect(
      interpretAppResponse(200, { status: 'applied', externalId: 'abc' }),
    ).toMatchObject({ result: 'APPLIED', externalId: 'abc' });
  });

  it('reads a 422 with field errors as rejected', () => {
    expect(
      interpretAppResponse(422, {
        status: 'rejected',
        errors: [
          {
            field: 'discountValue',
            code: 'out_of_range',
            message: 'percentage must be between 0 and 100',
          },
        ],
      }),
    ).toMatchObject({
      result: 'REJECTED',
      isRetryable: false,
      errors: [
        {
          field: 'discountValue',
          code: 'out_of_range',
          message: 'percentage must be between 0 and 100',
        },
      ],
    });
  });

  it('honours a rejection declared in a 200 body', () => {
    expect(
      interpretAppResponse(200, { status: 'rejected', message: 'duplicate' }),
    ).toMatchObject({
      result: 'REJECTED',
      errors: [{ field: null, code: null, message: 'duplicate' }],
    });
  });

  it('waits for a callback after 202', () => {
    expect(interpretAppResponse(202, null).result).toBe('ACCEPTED');
  });

  it('retries 5xx and 429 but not a wrong secret or URL', () => {
    expect(interpretAppResponse(503, 'Service Unavailable')).toMatchObject({
      result: 'ERROR',
      isRetryable: true,
    });
    expect(interpretAppResponse(429, null).isRetryable).toBe(true);
    expect(interpretAppResponse(401, { error: 'bad signature' })).toMatchObject(
      {
        result: 'ERROR',
        isRetryable: false,
        errors: [{ field: null, code: null, message: 'bad signature' }],
      },
    );
  });
});

describe('readAppErrors', () => {
  it('accepts strings, objects and a lone message', () => {
    expect(readAppErrors({ errors: ['code taken', { code: 'x' }] })).toEqual([
      { field: null, code: null, message: 'code taken' },
      { field: null, code: 'x', message: 'x' },
    ]);
    expect(readAppErrors('plain text')).toEqual([
      { field: null, code: null, message: 'plain text' },
    ]);
    expect(readAppErrors(null)).toEqual([]);
  });
});

describe('buildDeliveryPayload', () => {
  it("keeps the shape of Twenty's web hook body", () => {
    const payload = buildDeliveryPayload({
      targetUrl: 'https://api.example.com/crm/discount',
      action: 'UPDATE',
      workspaceId: 'workspace-1',
      objectMetadataId: 'object-1',
      record: { id: 'discount-1', discountValue: 25 },
      updatedFields: ['discountValue'],
    });

    expect(payload).toMatchObject({
      eventName: 'discount.updated',
      workspaceId: 'workspace-1',
      objectMetadata: { id: 'object-1', nameSingular: 'discount' },
      record: { id: 'discount-1', discountValue: 25 },
      updatedFields: ['discountValue'],
    });
  });
});
