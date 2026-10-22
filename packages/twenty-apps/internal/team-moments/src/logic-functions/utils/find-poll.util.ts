import { type Connection } from '../../types/connection';
import { type PollRow } from '../../types/moments-records';
import { createAppClient } from './create-app-client.util';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const findPollById = async (pollId: string | undefined): Promise<PollRow | null> => {
  if (pollId === undefined || !UUID_PATTERN.test(pollId)) {
    return null;
  }

  const client = createAppClient();

  const { polls } = (await client.query({
    polls: {
      __args: { filter: { id: { eq: pollId } }, first: 1 },
      edges: {
        node: {
          id: true,
          question: true,
          status: true,
          options: true,
          votes: true,
          createdById: true,
          closesAt: true,
          mattermostChannelId: true,
          mattermostPostId: true,
        },
      },
    },
  })) as { polls: Connection<PollRow> };

  return polls?.edges?.[0]?.node ?? null;
};
