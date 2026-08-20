import { isNonEmptyString } from '@sniptt/guards';
import { useDebounce } from 'use-debounce';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';

const SEARCH_DEBOUNCE_DELAY_IN_MS = 300;
const SEARCH_RESULTS_LIMIT = 8;

const ISSUE_SEARCH_RECORD_GQL_FIELDS = {
  id: true,
  title: true,
  issueKey: true,
  status: { id: true, name: true },
  project: { id: true, name: true },
};

// Jira-style quick search: issue key or title only, not the whole record.
// Deliberately not scoped to the selected project — looking up an issue you
// remember the key of is the main use, and that key may live anywhere.
export const useTaskManagerIssueSearch = (searchInput: string) => {
  const [debouncedSearchInput] = useDebounce(
    searchInput.trim(),
    SEARCH_DEBOUNCE_DELAY_IN_MS,
  );

  const hasSearchInput = isNonEmptyString(debouncedSearchInput);

  const { records, loading } = useFindManyRecords({
    objectNameSingular: 'issue',
    filter: {
      or: [
        { issueKey: { ilike: `%${debouncedSearchInput}%` } },
        { title: { ilike: `%${debouncedSearchInput}%` } },
      ],
    },
    orderBy: [{ updatedAt: 'DescNullsLast' }],
    recordGqlFields: ISSUE_SEARCH_RECORD_GQL_FIELDS,
    limit: SEARCH_RESULTS_LIMIT,
    skip: !hasSearchInput,
  });

  return {
    issues: hasSearchInput ? records : [],
    loading: hasSearchInput && loading,
    hasSearchInput,
  };
};
