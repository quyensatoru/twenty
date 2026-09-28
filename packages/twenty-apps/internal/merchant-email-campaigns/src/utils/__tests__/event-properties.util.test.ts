import { describe, expect, it } from 'vitest';

import { buildSampleTemplateVariables } from '../build-sample-template-variables.util';
import { interpolateTemplate } from '../interpolate-template.util';
import { normalizeShopDomain } from '../normalize-shop-domain.util';
import { readProviderMessageId } from '../read-provider-message-id.util';
import { stringifyEventProperties } from '../stringify-event-properties.util';

describe('event properties in templates', () => {
  it('flattens properties and reads them as {{event.key}}', () => {
    const eventProperties = stringifyEventProperties(
      { DOMAIN: 'a' },
      { days_left: 3, plan: { id: 1 }, gone: null },
    );

    expect(eventProperties).toEqual({
      DOMAIN: 'a',
      days_left: '3',
      plan: '{"id":1}',
    });
    expect(
      interpolateTemplate('{{event.days_left}} days · {{event.missing|soon}}', {
        ...buildSampleTemplateVariables(),
        eventProperties,
      }),
    ).toBe('3 days · soon');
  });
});

describe('normalizeShopDomain', () => {
  it('strips scheme, path and case', () => {
    expect(normalizeShopDomain(' HTTPS://Shop.myshopify.com/admin ')).toBe(
      'shop.myshopify.com',
    );
    expect(normalizeShopDomain('')).toBeNull();
    expect(normalizeShopDomain(3)).toBeNull();
  });
});

describe('readProviderMessageId', () => {
  it('finds common id fields', () => {
    expect(readProviderMessageId({ MessageId: 'abc' })).toBe('abc');
    expect(readProviderMessageId({ data: { id: 7 } })).toBe('7');
    expect(readProviderMessageId('ok')).toBe('');
  });
});
