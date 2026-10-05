import { mergeAppKeys } from './app-key';
import { type ParsedProspectRow } from './parse-prospect-csv';
import { computeProspectId } from './prospect-id';
import { pickHighestPlan } from './shopify-plan';

export type ImportDraft = {
  prospectId: string;
  domain: string;
  shopName: string | null;
  email: string | null;
  shopifyPlan: string | null;
  industry: string | null;
  appKeys: string[];
  lineNumbers: number[];
};

// Several rows of the same file can describe one shop (one line per app). They
// are folded here so the import writes each prospect once, which also means the
// row count shown in the preview is a count of shops, not of lines.
export const buildImportPlan = (rows: ParsedProspectRow[]): ImportDraft[] => {
  const draftByProspectId = new Map<string, ImportDraft>();

  for (const row of rows) {
    const prospectId = computeProspectId(row.domain);

    if (prospectId === null) {
      continue;
    }

    const existingDraft = draftByProspectId.get(prospectId);

    if (existingDraft === undefined) {
      draftByProspectId.set(prospectId, {
        prospectId,
        domain: row.domain,
        shopName: row.shopName,
        email: row.email,
        shopifyPlan: row.shopifyPlan,
        industry: row.industry,
        appKeys: [row.appKey],
        lineNumbers: [row.lineNumber],
      });

      continue;
    }

    existingDraft.shopName = existingDraft.shopName ?? row.shopName;
    existingDraft.email = existingDraft.email ?? row.email;
    existingDraft.industry = existingDraft.industry ?? row.industry;
    existingDraft.shopifyPlan = pickHighestPlan([
      existingDraft.shopifyPlan,
      row.shopifyPlan,
    ]);
    existingDraft.appKeys = mergeAppKeys(existingDraft.appKeys, [row.appKey]);
    existingDraft.lineNumbers.push(row.lineNumber);
  }

  return [...draftByProspectId.values()];
};
