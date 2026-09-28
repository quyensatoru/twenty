import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { TaskButton } from './task-button';
import { TaskTextInput } from './task-text-input';

type NewIssueComposerProps = {
  isBusy: boolean;
  onCreate: (title: string) => void;
};

// Creating an issue has to go through the app's route: that is where the
// project-scoped `issueKey` is allocated and the default reporter applied. A
// row added straight into the record table gets neither.
export const NewIssueComposer = ({
  isBusy,
  onCreate,
}: NewIssueComposerProps) => {
  const [title, setTitle] = useState('');

  const submit = () => {
    if (title.trim() === '') {
      return;
    }

    onCreate(title.trim());
    setTitle('');
  };

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
      <TaskTextInput
        ariaLabel={t('New issue title')}
        value={title}
        onChange={setTitle}
        placeholder={t('New issue…')}
        width={220}
      />
      <TaskButton
        variant="primary"
        isDisabled={isBusy || title.trim() === ''}
        onClick={submit}
      >
        {t('Create')}
      </TaskButton>
    </div>
  );
};
