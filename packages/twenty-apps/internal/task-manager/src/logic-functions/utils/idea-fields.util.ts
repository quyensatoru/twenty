import {
  IDEA_STATUS_OPTIONS,
  REQUEST_SOURCE_OPTIONS,
} from '../../constants/product-backlog';
import { type ApiClient } from '../../types/api-client';
import { type Idea } from '../../types/product-backlog';
import { listScopedRecords } from './list-scoped-records.util';

export const IDEA_SELECTION = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  source: true,
  requester: true,
  requestCount: true,
  quote: true,
  status: true,
  promotedIssueId: true,
  createdAt: true,
} as const;

const TEXT_KEYS = ['title', 'description', 'requester', 'quote'] as const;

// Only the fields a person may edit, each checked: an idea is written with
// the application token, so nothing unchecked may reach the mutation.
export const pickIdeaInput = (
  data: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const input: Record<string, unknown> = {};

  for (const key of TEXT_KEYS) {
    if (typeof data?.[key] === 'string') {
      input[key] = (data[key] as string).trim();
    }
  }

  if (REQUEST_SOURCE_OPTIONS.some((option) => option.value === data?.source)) {
    input.source = data?.source;
  }

  if (IDEA_STATUS_OPTIONS.some((option) => option.value === data?.status)) {
    input.status = data?.status;
  }

  if (
    typeof data?.requestCount === 'number' &&
    Number.isInteger(data.requestCount) &&
    data.requestCount >= 1
  ) {
    input.requestCount = data.requestCount;
  }

  return input;
};

export const fetchIdea = async (
  client: ApiClient,
  ideaId: string,
): Promise<(Idea & { projectId?: string | null }) | null> => {
  const [idea] = await listScopedRecords<Idea & { projectId?: string | null }>({
    client,
    pluralName: 'ideas',
    filter: { id: { eq: ideaId } },
    selection: IDEA_SELECTION,
    maxRecords: 1,
  });

  return idea ?? null;
};
