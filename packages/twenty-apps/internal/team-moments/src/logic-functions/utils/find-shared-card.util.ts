import { SHARE_PAGE_MESSAGE_LIMIT } from '../../constants/query-limits';
import { type Connection } from '../../types/connection';
import {
  type EventCardRow,
  type EventMessageRow,
  type TeamEventRow,
} from '../../types/moments-records';
import { createAppClient } from './create-app-client.util';

const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export type SharedCard = {
  card: EventCardRow;
  event: Pick<TeamEventRow, 'startTime' | 'location'> | null;
  messages: Pick<EventMessageRow, 'body' | 'authorId'>[];
};

export const findSharedCard = async (
  token: string | undefined,
): Promise<SharedCard | null> => {
  if (token === undefined || !SHARE_TOKEN_PATTERN.test(token)) {
    return null;
  }

  const client = createAppClient();

  const { eventCards } = (await client.query({
    eventCards: {
      __args: { filter: { shareToken: { eq: token } }, first: 1 },
      edges: {
        node: {
          id: true,
          occurrenceKey: true,
          eventTitle: true,
          eventDate: true,
          cardKind: true,
          templateKey: true,
          recipient: true,
          message: true,
          signatures: true,
          shareToken: true,
          backgroundImage: { fileId: true, label: true, url: true },
          thumbnail: { fileId: true, label: true, url: true },
        },
      },
    },
  })) as { eventCards: Connection<EventCardRow> };

  const card = eventCards?.edges?.[0]?.node;

  if (card === undefined) {
    return null;
  }

  const [, eventId] = card.occurrenceKey.split(':');
  const isStoredEvent = card.occurrenceKey.startsWith('event:');

  const [eventResult, messageResult] = await Promise.all([
    isStoredEvent
      ? (client.query({
          teamEvents: {
            __args: { filter: { id: { eq: eventId } }, first: 1 },
            edges: { node: { startTime: true, location: true } },
          },
        }) as Promise<{ teamEvents: Connection<Pick<TeamEventRow, 'startTime' | 'location'>> }>)
      : Promise.resolve(null),
    client.query({
      eventMessages: {
        __args: {
          filter: { occurrenceKey: { eq: card.occurrenceKey } },
          orderBy: [{ createdAt: 'DescNullsLast' }],
          first: SHARE_PAGE_MESSAGE_LIMIT,
        },
        edges: { node: { body: true, authorId: true } },
      },
    }) as Promise<{ eventMessages: Connection<Pick<EventMessageRow, 'body' | 'authorId'>> }>,
  ]);

  return {
    card,
    event: eventResult?.teamEvents?.edges?.[0]?.node ?? null,
    messages: (messageResult?.eventMessages?.edges ?? []).map((edge) => edge.node),
  };
};
