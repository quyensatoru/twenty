import { describe, expect, it } from 'vitest';

import { translateGeneratedText } from '../generated-text.util';
import { createCatalogTranslate } from '../translate.util';

const t = createCatalogTranslate({
  'Task created: {title}': 'Đã tạo task: {title}',
  'Follow up on issue: {title}': 'Follow-up issue: {title}',
  'Status changed to {status}': 'Trạng thái chuyển sang {status}',
  'At Risk': 'Có rủi ro',
  'PIC changed from {from} to {to}': 'Đổi PIC từ {from} sang {to}',
  nobody: 'chưa ai',
});

describe('translateGeneratedText', () => {
  it('translates nested generated titles and keeps the data', () => {
    expect(translateGeneratedText('Task created: Follow up on issue: Points missing', t)).toBe(
      'Đã tạo task: Follow-up issue: Points missing',
    );
  });

  it('translates the status label and placeholder names', () => {
    expect(translateGeneratedText('Status changed to At Risk', t)).toBe(
      'Trạng thái chuyển sang Có rủi ro',
    );
    expect(translateGeneratedText('PIC changed from nobody to Jony Ive', t)).toBe(
      'Đổi PIC từ chưa ai sang Jony Ive',
    );
  });

  it('leaves free text a BC typed unchanged', () => {
    expect(translateGeneratedText('Call Rip Curl about Meta CAPI', t)).toBe(
      'Call Rip Curl about Meta CAPI',
    );
  });
});
