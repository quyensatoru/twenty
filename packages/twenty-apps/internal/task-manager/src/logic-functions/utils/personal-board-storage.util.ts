import { type ApiClient } from '../../types/api-client';
import { type PersonalBoardStateRow } from '../../types/task-personal-board';
import { readPersonalBoardPreferences } from '../../utils/read-personal-board-state.util';
import { listScopedRecords } from './list-scoped-records.util';
import { getDevelopmentRecordId } from './upsert-development-links.util';

export const PERSONAL_BOARD_STATE_SELECTION = {
  id: true,
  memberId: true,
  issueId: true,
  configuration: true,
};
export const getPersonalBoardStateId = (
  memberId: string,
  issueId: string | null,
) =>
  getDevelopmentRecordId([
    'task-personal-board',
    memberId,
    issueId ?? 'preferences',
  ]);

export const readPersonalBoardPreferencesForMember = async (
  client: ApiClient,
  memberId: string,
) => {
  const rows = await listScopedRecords<PersonalBoardStateRow>({
    client,
    pluralName: 'taskPersonalBoardStates',
    filter: {
      id: { eq: getPersonalBoardStateId(memberId, null) },
      memberId: { eq: memberId },
    },
    selection: PERSONAL_BOARD_STATE_SELECTION,
    maxRecords: 1,
  });
  return readPersonalBoardPreferences(rows[0]?.configuration);
};
