import { useState } from 'react';

import {
  DEFAULT_VISIBLE_ISSUE_CARD_FIELDS,
  type IssueCardFieldName,
} from '../../constants/issue-card-fields';

// Selection lives for the life of the mounted board. It is deliberately not
// persisted: the sandbox has no `window`, so `localStorage` is unreachable, and
// the SDK's execution context exposes `storageSet`/`storageDelete` with no
// matching read, so nothing written could be loaded back.
export const useVisibleIssueCardFields = () => {
  const [visibleFields, setVisibleFields] = useState<IssueCardFieldName[]>(
    DEFAULT_VISIBLE_ISSUE_CARD_FIELDS,
  );

  const toggleField = (fieldName: IssueCardFieldName) => {
    setVisibleFields((current) =>
      current.includes(fieldName)
        ? current.filter((entry) => entry !== fieldName)
        : [...current, fieldName],
    );
  };

  return { visibleFields, toggleField };
};
