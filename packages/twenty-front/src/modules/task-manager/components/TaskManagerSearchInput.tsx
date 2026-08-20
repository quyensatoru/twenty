import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { SearchInput } from 'twenty-ui/input';
import { useDebouncedCallback } from 'use-debounce';

import { TASK_MANAGER_SEARCH_PARAM } from '@/task-manager/constants/TaskManagerSearchParam';

const SEARCH_DEBOUNCE_DELAY_IN_MS = 300;

const StyledSearchInputContainer = styled.div`
  width: 240px;
`;

export const TaskManagerSearchInput = () => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInputValue, setSearchInputValue] = useState(
    searchParams.get(TASK_MANAGER_SEARCH_PARAM) ?? '',
  );

  // Each keystroke would otherwise push a history entry and refetch the board.
  const commitSearchQuery = useDebouncedCallback((searchQuery: string) => {
    setSearchParams(
      (previousSearchParams) => {
        const nextSearchParams = new URLSearchParams(previousSearchParams);

        if (searchQuery === '') {
          nextSearchParams.delete(TASK_MANAGER_SEARCH_PARAM);
        } else {
          nextSearchParams.set(TASK_MANAGER_SEARCH_PARAM, searchQuery);
        }

        return nextSearchParams;
      },
      { replace: true },
    );
  }, SEARCH_DEBOUNCE_DELAY_IN_MS);

  const handleSearchChange = (searchQuery: string) => {
    setSearchInputValue(searchQuery);
    commitSearchQuery(searchQuery);
  };

  return (
    <StyledSearchInputContainer>
      <SearchInput
        value={searchInputValue}
        onChange={handleSearchChange}
        placeholder={t`Search issues`}
      />
    </StyledSearchInputContainer>
  );
};
