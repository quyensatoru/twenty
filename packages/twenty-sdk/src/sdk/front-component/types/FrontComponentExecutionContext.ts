import { type AppLocale } from 'twenty-shared/translations';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

import { type FrontComponentSelectedObjectMetadata } from './FrontComponentSelectedObjectMetadata';
import { type FrontComponentToolCall } from './FrontComponentToolCall';

export type FrontComponentExecutionContext = {
  frontComponentId: string;
  userId: string | null;
  /**
   * @deprecated Use `selectedRecordIds` instead. Derive single record as `selectedRecordIds.length === 1 ? selectedRecordIds[0] : null`.
   */
  recordId: string | null;
  /** All selected record IDs */
  selectedRecordIds: string[];
  /**
   * Filter matching exactly the selected records. Under Select all,
   * `selectedRecordIds` is empty and only this filter describes the selection.
   */
  selectedRecordsFilter?: RecordGqlOperationFilter | null;
  selectedObjectMetadata?: FrontComponentSelectedObjectMetadata | null;
  timelineActivityId: string | null;
  /** Resolved color scheme of the host UI ('System' is already resolved) */
  colorScheme: 'light' | 'dark';
  locale?: AppLocale;
  /**
   * Fragment of the host page's URL, without the leading '#', empty when there
   * is none. A front component runs in a worker with an opaque origin and no
   * `location` of its own, so this is the only way it can answer a deep link
   * that addresses something inside it rather than the record as a whole.
   */
  locationHash?: string;
  /**
   * Path of the host page, without query or fragment. A front component runs
   * in a worker with an opaque origin and no `location` of its own, so this
   * is the only way it can link back to exactly the page it renders on.
   */
  locationPathname?: string;
  /** Set when the component renders an AI chat tool call */
  toolCall?: FrontComponentToolCall;
};
