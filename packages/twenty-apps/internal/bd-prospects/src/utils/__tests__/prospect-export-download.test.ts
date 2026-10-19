import { describe, expect, it } from 'vitest';

import { buildProspectExportFiles } from '../export-prospects';
import { buildProspectExportDownloadDocument } from '../prospect-export-download';

describe('buildProspectExportDownloadDocument', () => {
  it('offers downloads of both files without including raw store data in the HTML', () => {
    const files = buildProspectExportFiles([
      {
        id: 'one',
        domain: '</a><script>alert(1)</script>',
        email: null,
        linkedinPage: null,
        shopifyPlan: null,
        ourApps: null,
      },
    ]);
    const html = buildProspectExportDownloadDocument(files, 'dark');

    expect(html).toContain(
      `href="data:${files.csv.mimeType};base64,${files.csv.base64}"`,
    );
    expect(html).toContain(
      `href="data:${files.xlsx.mimeType};base64,${files.xlsx.base64}"`,
    );
    expect(html).toContain('download="bd-prospects.csv"');
    expect(html).toContain('download="bd-prospects.xlsx"');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)');
  });
});
