const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

// Issue keys are a project prefix and a number (HEAT-4, BLOY-120). Links come
// in the two shapes support pastes: the record page (/object/issue/<id>) and
// the task board with the issue open (/page/<board>#issue-<id>).
const ISSUE_KEY_PATTERN = /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/g;
const ISSUE_URL_PATTERN = new RegExp(
  `(?:/object/issue/|#issue-)(${UUID})`,
  'gi',
);

export type IssueReferences = {
  issueKeys: string[];
  issueIds: string[];
};

export const extractIssueReferences = (text: string): IssueReferences => ({
  issueKeys: [...new Set(text.match(ISSUE_KEY_PATTERN) ?? [])],
  issueIds: [
    ...new Set(
      [...text.matchAll(ISSUE_URL_PATTERN)].map((match) =>
        match[1].toLowerCase(),
      ),
    ),
  ],
});

export const hasIssueReferences = (references: IssueReferences): boolean =>
  references.issueKeys.length > 0 || references.issueIds.length > 0;
