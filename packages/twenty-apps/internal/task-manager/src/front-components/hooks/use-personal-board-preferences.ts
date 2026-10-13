import { useEffect, useRef, useState } from 'react';

import { TASK_PERSONAL_BOARD_ROUTE_PATH } from '../../constants/task-personal-board';
import { type PersonalBoardPreferences } from '../../types/task-personal-board';
import { readPersonalBoardPreferences } from '../../utils/read-personal-board-state.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';

export const usePersonalBoardPreferences = (
  memberId: string | null | undefined,
  stored: PersonalBoardPreferences | undefined,
) => {
  const [preferences, setPreferences] = useState(() =>
    readPersonalBoardPreferences(stored),
  );
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const currentMemberId = useRef(memberId);
  currentMemberId.current = memberId;
  const isSaving = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => {
    currentMemberId.current = memberId;
    setPreferences(readPersonalBoardPreferences(stored));
    setPreferencesError(null);
    isSaving.current = false;
    setIsSavingPreferences(false);
    // Refreshing task counts must not overwrite a newer personal preference.
  }, [memberId]);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const savePreferences = async (patch: Partial<PersonalBoardPreferences>) => {
    if (isSaving.current) return false;
    const previous = preferences;
    const next = readPersonalBoardPreferences({ ...previous, ...patch });
    setPreferences(next);
    if (!memberId) return true;
    isSaving.current = true;
    setIsSavingPreferences(true);
    setPreferencesError(null);
    try {
      await postAppRoute(TASK_PERSONAL_BOARD_ROUTE_PATH, {
        action: 'preferences',
        patch,
      });
      return isMounted.current && currentMemberId.current === memberId;
    } catch (error) {
      if (isMounted.current && currentMemberId.current === memberId) {
        setPreferences(previous);
        setPreferencesError(readErrorText(error));
      }
      return false;
    } finally {
      if (isMounted.current && currentMemberId.current === memberId) {
        isSaving.current = false;
        setIsSavingPreferences(false);
      }
    }
  };
  return {
    preferences,
    savePreferences,
    isSavingPreferences,
    preferencesError,
  };
};
