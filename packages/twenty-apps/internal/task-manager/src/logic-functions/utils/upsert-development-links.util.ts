import { createHash } from 'node:crypto';

import { type ApiClient } from '../../types/api-client';
import {
  normalizeDevelopmentReference,
  type DevelopmentLinkKind,
  type DevelopmentReferenceInput,
  type NormalizedDevelopmentReference,
} from '../../utils/normalize-development-reference.util';
import { listScopedRecords } from './list-scoped-records.util';
import {
  chunkItems,
  ISSUE_KEY_LOOKUP_BATCH_SIZE,
  resolveIssueTargetsByKey,
} from './resolve-issue-targets-by-key.util';

const LINK_WRITE_BATCH_SIZE = 100;

type ExistingDevelopmentLink = {
  id: string;
  issueId: string;
  linkType: DevelopmentLinkKind;
  externalId: string | null;
  title: string | null;
  url: string | null;
  status: string | null;
  authorName: string | null;
};

type LinkWrite = {
  issueId: string;
  appId: string | null;
  reference: NormalizedDevelopmentReference;
};

const toLinkMatchKey = (
  issueId: string,
  type: DevelopmentLinkKind,
  externalId: string,
): string => JSON.stringify([issueId, type, externalId]);

// The single funnel every git reference flows through — provider webhooks and
// the backfill worker alike. Keys resolve to issues, then each (issue, type,
// externalId) either updates or creates, so redeliveries stay idempotent.
// Reads and creates go out in batches: a per-reference request loop drains the
// app's shared rate limit on any real repository.
export const upsertDevelopmentReferences = async ({
  client,
  references,
  repositoryId,
  defaultRepositorySlug,
}: {
  client: ApiClient;
  references: DevelopmentReferenceInput[];
  repositoryId: string | null;
  defaultRepositorySlug: string | null;
}): Promise<{
  created: number;
  updated: number;
  skipped: number;
  unknownIssueKeys: string[];
}> => {
  const normalizedReferences = references.map((input) =>
    normalizeDevelopmentReference(input ?? {}),
  );
  const keyedReferences = normalizedReferences.filter(
    (reference) => reference.issueKeys.length > 0,
  );
  const skipped = normalizedReferences.length - keyedReferences.length;

  const targets = await resolveIssueTargetsByKey({
    client,
    issueKeys: keyedReferences.flatMap((reference) => reference.issueKeys),
  });

  const unknownIssueKeys: string[] = [];
  const writesByMatchKey = new Map<string, LinkWrite>();
  const writesWithoutExternalId: LinkWrite[] = [];

  for (const reference of keyedReferences) {
    for (const issueKey of reference.issueKeys) {
      const target = targets.get(issueKey);

      if (target === undefined) {
        unknownIssueKeys.push(issueKey);
        continue;
      }

      const write = { issueId: target.issueId, appId: target.appId, reference };

      if (reference.externalId === null) {
        writesWithoutExternalId.push(write);
      } else {
        writesByMatchKey.set(
          toLinkMatchKey(target.issueId, reference.type, reference.externalId),
          write,
        );
      }
    }
  }

  const existingByMatchKey = await listExistingLinks({
    client,
    repositoryId,
    issueIds: [
      ...new Set([...writesByMatchKey.values()].map((write) => write.issueId)),
    ],
  });

  let updated = 0;
  const creates: LinkWrite[] = [...writesWithoutExternalId];

  for (const [matchKey, write] of writesByMatchKey) {
    const existing = existingByMatchKey.get(matchKey);

    if (existing === undefined) {
      creates.push(write);
      continue;
    }

    updated += 1;

    const { title, url, status, authorName } = write.reference;

    if (
      existing.title === title &&
      existing.url === url &&
      existing.status === status &&
      existing.authorName === authorName
    ) {
      continue;
    }

    await client.mutation({
      updateDevelopmentLink: {
        __args: {
          id: existing.id,
          data: { title, url, status, authorName, repositoryId },
        },
        id: true,
      },
    });
  }

  // Deterministic ids plus `upsert` make a concurrent insert of the same
  // reference (webhook racing the backfill) update the row instead of failing.
  for (const batch of chunkItems(creates, LINK_WRITE_BATCH_SIZE)) {
    await client.mutation({
      createDevelopmentLinks: {
        __args: {
          data: batch.map(({ issueId, appId, reference }) => ({
            ...(reference.externalId === null
              ? {}
              : {
                  id: getDevelopmentRecordId([
                    repositoryId,
                    issueId,
                    reference.type,
                    reference.externalId,
                  ]),
                }),
            linkType: reference.type,
            title:
              reference.title ?? reference.externalId ?? defaultRepositorySlug,
            url: reference.url,
            status: reference.status,
            externalId: reference.externalId,
            authorName: reference.authorName,
            issueId,
            repositoryId,
            appId,
          })),
          upsert: true,
        },
        id: true,
      },
    });
  }

  return {
    created: creates.length,
    updated,
    skipped,
    unknownIssueKeys: [...new Set(unknownIssueKeys)],
  };
};

const listExistingLinks = async ({
  client,
  repositoryId,
  issueIds,
}: {
  client: ApiClient;
  repositoryId: string | null;
  issueIds: string[];
}): Promise<Map<string, ExistingDevelopmentLink>> => {
  const existingByMatchKey = new Map<string, ExistingDevelopmentLink>();

  for (const batch of chunkItems(issueIds, ISSUE_KEY_LOOKUP_BATCH_SIZE)) {
    const links = await listScopedRecords<ExistingDevelopmentLink>({
      client,
      pluralName: 'developmentLinks',
      filter: {
        repositoryId:
          repositoryId === null ? { is: 'NULL' } : { eq: repositoryId },
        issueId: { in: batch },
      },
      selection: {
        id: true,
        issueId: true,
        linkType: true,
        externalId: true,
        title: true,
        url: true,
        status: true,
        authorName: true,
      },
    });

    for (const link of links) {
      if (link.externalId !== null) {
        existingByMatchKey.set(
          toLinkMatchKey(link.issueId, link.linkType, link.externalId),
          link,
        );
      }
    }
  }

  return existingByMatchKey;
};

// A primary-key constraint arbitrates concurrent inserts without a read/write lock.
export const getDevelopmentRecordId = (parts: (string | null)[]): string => {
  const hash = createHash('sha256').update(JSON.stringify(parts)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
