import { describe, expect, it } from 'vitest';

import { DEFAULT_EMAIL_DESIGN } from '../../constants/default-email-design';
import { type EmailDesign } from '../../types/email-design';
import { type TemplateVariables } from '../../types/template-variables';
import { buildSampleTemplateVariables } from '../build-sample-template-variables.util';
import { buildTemplateVariables } from '../build-template-variables.util';
import { convertBlocksToHtml } from '../convert-blocks-to-html.util';
import { evaluateTemplateExpression } from '../evaluate-template-expression.util';
import { findTemplateErrors } from '../find-template-errors.util';
import { interpolateTemplate } from '../interpolate-template.util';
import { parseEmailDesign } from '../parse-email-design.util';
import { renderCustomHtmlEmail } from '../render-custom-html-email.util';
import { renderEmailHtml } from '../render-email-html.util';
import { renderEmailText } from '../render-email-text.util';
import {
  evaluateTemplateCondition,
  parseTemplateConditionText,
} from '../template-condition.util';
import { findTemplateTextError } from '../template-sections.util';

const NOW = new Date('2026-10-12T10:00:00.000Z');

const variablesInstalledDaysAgo = (days: number): TemplateVariables => ({
  ...buildSampleTemplateVariables({ daysSinceInstall: days, now: NOW }),
  pricingPlan: 'FREE',
  eventProperties: { offer_ends_at: '2026-10-20', coupon: '' },
});

describe('evaluateTemplateExpression', () => {
  const variables = variablesInstalledDaysAgo(9);

  it('counts whole UTC days on both sides of a date', () => {
    expect(
      evaluateTemplateExpression('daysSince installedAt', variables),
    ).toEqual({ kind: 'NUMBER', value: 9 });
    expect(
      evaluateTemplateExpression('daysUntil installedAt+14d', variables),
    ).toEqual({ kind: 'NUMBER', value: 5 });
    expect(
      evaluateTemplateExpression('daysUntil event.offer_ends_at', variables),
    ).toEqual({ kind: 'NUMBER', value: 8 });
  });

  it('shifts by weeks and clamps months', () => {
    expect(
      evaluateTemplateExpression('date installedAt+1w', variables),
    ).toEqual({ kind: 'TEXT', value: 'Oct 10, 2026' });
    expect(
      evaluateTemplateExpression('date event.end+1m', {
        ...variables,
        eventProperties: { end: '2026-01-31' },
      }),
    ).toEqual({ kind: 'TEXT', value: 'Feb 28, 2026' });
  });

  it('tells a missing date from an unreadable expression', () => {
    expect(
      evaluateTemplateExpression('daysSince uninstalledAt', variables),
    ).toEqual({ kind: 'MISSING' });
    expect(
      evaluateTemplateExpression('daysSince instaledAt', variables),
    ).toEqual({ kind: 'INVALID' });
  });
});

describe('interpolateTemplate with dates', () => {
  it('renders day counts, clamped at zero, with fallbacks', () => {
    const variables = variablesInstalledDaysAgo(20);

    expect(
      interpolateTemplate(
        'Used {{daysSince installedAt}} days, trial ends in {{daysUntil installedAt+14d}}, left {{daysSince uninstalledAt|never}}',
        variables,
      ),
    ).toBe('Used 20 days, trial ends in 0, left never');
  });

  it('keeps the old variable syntax working', () => {
    expect(
      interpolateTemplate('Hi {{ contactName|there }} from {{storeName}}', {
        ...variablesInstalledDaysAgo(1),
        contactName: '',
      }),
    ).toBe('Hi there from Demo Store');
  });
});

describe('template conditions', () => {
  it('parses text conditions and rejects unreadable ones', () => {
    expect(
      parseTemplateConditionText(
        'daysSince installedAt &gt;= 30 and pricingPlan = "FREE"',
      ),
    ).toEqual([
      { value: 'daysSince installedAt', operator: '>=', compareTo: '30' },
      { value: 'pricingPlan', operator: '=', compareTo: 'FREE' },
    ]);
    expect(parseTemplateConditionText('event.coupon')).toEqual([
      { value: 'event.coupon', operator: '!=', compareTo: '' },
    ]);
    expect(parseTemplateConditionText('daysSince nope > 1')).toBeNull();
  });

  it('compares numbers, text case-insensitively, and emptiness', () => {
    const variables = variablesInstalledDaysAgo(30);
    const check = (text: string) =>
      (parseTemplateConditionText(text) ?? []).every((condition) =>
        evaluateTemplateCondition(condition, variables),
      );

    expect(check('daysSince installedAt = 30')).toBe(true);
    expect(check('daysSince installedAt > 30')).toBe(false);
    expect(check('daysSince installedAt <= 30 and pricingPlan = free')).toBe(
      true,
    );
    expect(check('pricingPlan != FREE')).toBe(false);
    expect(check('event.coupon')).toBe(false);
    expect(check('event.coupon = ""')).toBe(true);
    expect(check('daysSince uninstalledAt = ""')).toBe(true);
    expect(check('daysSince uninstalledAt != 3')).toBe(false);
  });

  it('treats an unreadable condition as false', () => {
    expect(
      evaluateTemplateCondition(
        { value: '', operator: '=', compareTo: '' },
        variablesInstalledDaysAgo(1),
      ),
    ).toBe(false);
  });
});

describe('{{#if}} sections', () => {
  const template =
    '{{#if daysSince installedAt = 30}}One month!{{else}}{{#if pricingPlan = FREE}}Upgrade{{else}}Thanks{{/if}}{{/if}}';

  it('renders the matching branch, nested', () => {
    expect(interpolateTemplate(template, variablesInstalledDaysAgo(30))).toBe(
      'One month!',
    );
    expect(interpolateTemplate(template, variablesInstalledDaysAgo(3))).toBe(
      'Upgrade',
    );
    expect(
      interpolateTemplate(template, {
        ...variablesInstalledDaysAgo(3),
        pricingPlan: 'PLUS',
      }),
    ).toBe('Thanks');
  });

  it('reports structural and expression errors', () => {
    expect(findTemplateTextError(template)).toBeNull();
    expect(findTemplateTextError('{{#if pricingPlan}}x')).toBe(
      '{{#if}} is never closed with {{/if}}',
    );
    expect(findTemplateTextError('x{{/if}}')).toBe(
      '{{/if}} without a matching {{#if}}',
    );
    expect(findTemplateTextError('{{#if a}}1{{else}}2{{else}}3{{/if}}')).toBe(
      'Two {{else}} in the same {{#if}}',
    );
    expect(findTemplateTextError('{{daysSince instaledAt}}')).toBe(
      'Cannot read "{{daysSince instaledAt}}"',
    );
  });
});

describe('block showIf', () => {
  const design: EmailDesign = parseEmailDesign({
    ...DEFAULT_EMAIL_DESIGN,
    blocks: [
      { id: 'always', type: 'text', text: 'Always here', align: 'left' },
      {
        id: 'month',
        type: 'text',
        text: 'One month gift',
        align: 'left',
        showIf: [
          { value: 'daysSince installedAt', operator: '=', compareTo: '30' },
        ],
      },
      {
        id: 'broken',
        type: 'text',
        text: 'Broken condition',
        align: 'left',
        showIf: ['nope'],
      },
    ],
  });

  const render = (variables: TemplateVariables) =>
    renderEmailHtml({ design, subject: 's', previewText: '', variables });

  it('hides blocks whose conditions fail, in HTML and text alike', () => {
    const atMonth = variablesInstalledDaysAgo(30);
    const before = variablesInstalledDaysAgo(29);

    expect(render(atMonth)).toContain('One month gift');
    expect(render(before)).not.toContain('One month gift');
    expect(renderEmailText(design, atMonth)).toContain('One month gift');
    expect(renderEmailText(design, before)).not.toContain('One month gift');
    expect(render(atMonth)).not.toContain('Broken condition');
    expect(render(atMonth)).toContain('Always here');
  });

  it('keeps conditions when converting blocks to HTML', () => {
    const html = convertBlocksToHtml({
      ...design,
      blocks: [
        {
          id: 'gift',
          type: 'text',
          text: 'Day {{daysSince installedAt}}',
          align: 'left',
          showIf: [
            { value: 'daysSince installedAt', operator: '>=', compareTo: '30' },
          ],
        },
      ],
    });

    expect(html).toContain('{{#if daysSince installedAt >= 30}}');
    expect(html).toContain('Day {{daysSince installedAt}}');
    expect(
      renderCustomHtmlEmail({
        design: { ...design, mode: 'html', html, css: '' },
        subject: '',
        previewText: '',
        variables: variablesInstalledDaysAgo(31),
      }),
    ).toContain('Day 31');
  });

  it('flags unreadable block conditions', () => {
    expect(
      findTemplateErrors({ subject: 'Hi', previewText: '', design }),
    ).toEqual(['Block 3: a "Show if" condition cannot be read']);
  });
});

describe('unsubscribe link in a hidden branch', () => {
  it('still appends the footer', () => {
    const html = renderCustomHtmlEmail({
      design: {
        ...DEFAULT_EMAIL_DESIGN,
        mode: 'html',
        html: '<p>Hi</p>{{#if pricingPlan = PLUS}}<a href="{{unsubscribeUrl}}">out</a>{{/if}}',
        css: '',
      },
      subject: '',
      previewText: '',
      variables: {
        ...variablesInstalledDaysAgo(1),
        unsubscribeUrl: 'https://u',
      },
    });

    expect(html).toContain(DEFAULT_EMAIL_DESIGN.settings.unsubscribeLabel);
  });
});

describe('buildTemplateVariables dates', () => {
  it('falls back to the CRM creation date for the install date', () => {
    const variables = buildTemplateVariables({
      merchant: { id: 'm', createdAt: '2026-09-01T00:00:00.000Z' },
      appName: 'MIDA',
      unsubscribeUrl: 'https://u',
      now: NOW,
    });

    expect(variables.dates).toEqual({
      installedAt: '2026-09-01T00:00:00.000Z',
      uninstalledAt: null,
      addedToCrmAt: '2026-09-01T00:00:00.000Z',
    });
    expect(interpolateTemplate('{{daysSince installedAt}}', variables)).toBe(
      '41',
    );
  });
});
