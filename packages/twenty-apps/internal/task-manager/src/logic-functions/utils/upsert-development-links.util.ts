import { createHash } from 'node:crypto';

import { DEVELOPMENT_LINK_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import {
  normalizeDevelopmentReference,
  type DevelopmentLinkKind,
  type DevelopmentReferenceInput,
} from '../../utils/normalize-development-reference.util';
import { resolveEffectiveAppId } from '../app-scope/resolve-effective-app-id.util';
import { listScopedRecords } from './list-scoped-records.util';

// The single funnel every git reference flows through — provider webhooks and
// the backfill worker alike. Keys resolve to issues, then each (issue, type,
// externalId) either updates or creates, so redeliveries stay idempotent.
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
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const unknownIssueKeys: string[] = [];

  for (const input of references) {
    const reference = normalizeDevelopmentReference(input ?? {});

    if (reference.issueKeys.length === 0) {
      skipped += 1;
      continue;
    }

    for (const issueKey of reference.issueKeys) {
      const issueId = await findIssueIdByKey(client, issueKey);

      if (issueId === null) {
        unknownIssueKeys.push(issueKey);
        continue;
      }

      const outcome = await upsertDevelopmentLink({
        client,
        issueId,
        repositoryId,
        defaultRepositorySlug,
        type: reference.type,
        title: reference.title,
        url: reference.url,
        status: reference.status,
        externalId: reference.externalId,
        authorName: reference.authorName,
      });

      if (outcome === 'created') {
        created += 1;
      } else {
        updated += 1;
      }
    }
  }

  return {
    created,
    updated,
    skipped,
    unknownIssueKeys: [...new Set(unknownIssueKeys)],
  };
};

const findIssueIdByKey = async (
  client: ApiClient,
  issueKey: string,
): Promise<string | null> => {
  const result = await client.query({
    issues: {
      __args: { filter: { issueKey: { eq: issueKey } }, first: 1 },
      edges: { node: { id: true } },
    },
  });

  const connection = result?.issues as Connection<{ id: string }> | undefined;

  return connection?.edges?.[0]?.node?.id ?? null;
};

const upsertDevelopmentLink = async ({
  client,
  issueId,
  repositoryId,
  defaultRepositorySlug,
  type,
  title,
  url,
  status,
  externalId,
  authorName,
}: {
  client: ApiClient;
  issueId: string;
  repositoryId: string | null;
  defaultRepositorySlug: string | null;
  type: DevelopmentLinkKind;
  title: string | null;
  url: string | null;
  status: string | null;
  externalId: string | null;
  authorName: string | null;
}): Promise<'created' | 'updated'> => {
  // Without an external id there is nothing stable to match on, so it always
  // creates rather than collapsing distinct rows.
  if (externalId !== null) {
    const existing = await listScopedRecords<{ id: string }>({
      client,
      pluralName: 'developmentLinks',
      filter: {
        repositoryId:
          repositoryId === null ? { is: 'NULL' } : { eq: repositoryId },
        issueId: { eq: issueId },
        linkType: { eq: type },
        externalId: { eq: externalId },
      },
      selection: { id: true },
      maxRecords: 1,
    });

    const existingId = existing[0]?.id;

    if (existingId !== undefined) {
      await client.mutation({
        updateDevelopmentLink: {
          __args: {
            id: existingId,
            data: {
              title,
              url,
              status,
              authorName,
              repositoryId,
            },
          },
          id: true,
        },
      });

      return 'updated';
    }
  }

  const id =
    externalId === null
      ? undefined
      : getDevelopmentRecordId([repositoryId, issueId, type, externalId]);

  try {
    await client.mutation({
      createDevelopmentLink: {
        __args: {
          data: {
            ...(id === undefined ? {} : { id }),
            linkType: type,
            title: title ?? externalId ?? defaultRepositorySlug,
            url,
            status,
            externalId,
            authorName,
            issueId,
            repositoryId,
            appId: await resolveEffectiveAppId({
              client,
              objectNameSingular: 'developmentLink',
              immediateForeignKeyValue: issueId,
            }),
          },
        },
        ...DEVELOPMENT_LINK_SELECTION,
      },
    });
  } catch (error) {
    if (id === undefined) throw error;
    const existing = await listScopedRecords<{ id: string }>({
      client,
      pluralName: 'developmentLinks',
      filter: { id: { eq: id } },
      selection: { id: true },
      maxRecords: 1,
    });
    if (existing.length === 0) throw error;
    await client.mutation({
      updateDevelopmentLink: {
        __args: { id, data: { title, url, status, authorName } },
        id: true,
      },
    });
    return 'updated';
  }

  return 'created';
};

// A primary-key constraint arbitrates concurrent inserts without a read/write lock.
export const getDevelopmentRecordId = (parts: (string | null)[]): string => {
  const hash = createHash('sha256').update(JSON.stringify(parts)).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
};
