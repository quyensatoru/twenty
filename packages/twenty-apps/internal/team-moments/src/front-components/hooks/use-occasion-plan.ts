import { useCallback, useEffect, useRef, useState } from 'react';

import { type OccasionPlanRow } from '../../types/moments-records';
import { createRecord, listRecords, readErrorText, updateRecord } from '../utils/moments-rest.util';

const POLL_MILLIS = 10_000;

// The plan row of one occurrence. It is created on the first write, so an
// occasion nobody plans for leaves no empty row behind.
export const useOccasionPlan = (occurrenceKey: string) => {
  const [plan, setPlan] = useState<OccasionPlanRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const planRef = useRef<OccasionPlanRow | null>(null);

  planRef.current = plan;

  const load = useCallback(async () => {
    try {
      const [row] = await listRecords<OccasionPlanRow>('occasionPlans', {
        filter: `occurrenceKey[eq]:"${occurrenceKey}"`,
        limit: 1,
      });

      setPlan(row ?? null);
      setError(null);
    } catch (loadError) {
      setError(readErrorText(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [occurrenceKey]);

  useEffect(() => {
    setIsLoading(true);
    setPlan(null);
    void load();

    const timer = setInterval(() => void load(), POLL_MILLIS);

    return () => clearInterval(timer);
  }, [load]);

  // Each change is computed from the freshest row (re-read first), so two
  // members contributing a few seconds apart do not overwrite each other.
  const savePlan = async (
    buildPatch: (current: OccasionPlanRow | null) => Partial<OccasionPlanRow>,
  ): Promise<boolean> => {
    try {
      const [fresh] = await listRecords<OccasionPlanRow>('occasionPlans', {
        filter: `occurrenceKey[eq]:"${occurrenceKey}"`,
        limit: 1,
      });
      const patch = buildPatch(fresh ?? null);
      const saved =
        fresh === undefined
          ? await createRecord<OccasionPlanRow>('occasionPlans', { occurrenceKey, ...patch })
          : await updateRecord<OccasionPlanRow>('occasionPlans', fresh.id, patch);

      setPlan(saved);
      setError(null);

      return true;
    } catch (saveError) {
      setError(readErrorText(saveError));

      return false;
    }
  };

  return { plan, isLoading, error, savePlan };
};
