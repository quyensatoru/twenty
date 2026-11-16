import { type HistoryEntry } from '../types/bc-records';

const MAX_HISTORY_ENTRIES = 200;

export const appendHistory = (
  history: HistoryEntry[] | null | undefined,
  entry: Omit<HistoryEntry, 'at'> & { at?: string },
): HistoryEntry[] =>
  [
    ...(Array.isArray(history) ? history : []),
    { ...entry, at: entry.at ?? new Date().toISOString() },
  ].slice(-MAX_HISTORY_ENTRIES);
