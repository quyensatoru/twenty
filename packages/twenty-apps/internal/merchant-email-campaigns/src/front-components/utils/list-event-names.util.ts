import { LIST_EVENT_NAMES_ROUTE_PATH } from '../../constants/route-paths';
import { type EventNameSuggestion } from '../../types/event-name-suggestion';
import { postAppRoute } from './post-app-route.util';

export const listEventNames = async (): Promise<EventNameSuggestion[]> => {
  const { eventNames } = await postAppRoute<{
    success: boolean;
    eventNames: EventNameSuggestion[];
  }>(LIST_EVENT_NAMES_ROUTE_PATH, {});

  return eventNames;
};
