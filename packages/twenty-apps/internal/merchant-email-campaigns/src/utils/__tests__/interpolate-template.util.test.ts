import { describe, expect, it } from 'vitest';

import { buildSampleTemplateVariables } from '../build-sample-template-variables.util';
import { interpolateTemplate } from '../interpolate-template.util';

const variables = { ...buildSampleTemplateVariables(), contactName: '' };

describe('interpolateTemplate', () => {
  it('replaces known variables', () => {
    expect(
      interpolateTemplate('Hi {{ storeName }} on {{appName}}', variables),
    ).toBe('Hi Demo Store on MIDA');
  });

  it('uses the fallback when the value is empty', () => {
    expect(interpolateTemplate('Hi {{contactName|there}}', variables)).toBe(
      'Hi there',
    );
  });

  it('renders unknown variables as empty', () => {
    expect(interpolateTemplate('[{{nope}}]', variables)).toBe('[]');
  });
});
