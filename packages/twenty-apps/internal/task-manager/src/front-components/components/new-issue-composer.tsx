import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';

import { IconPlus } from 'twenty-ui/icon';

import { TaskButton } from './task-button';
import { TaskTextInput } from './task-text-input';
import { TASK_TOKENS } from './task-tokens';

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
  const [titleKey, setTitleKey] = useState(0);

  const submit = () => {
    if (title.trim() === '') {
      return;
    }

    onCreate(title.trim());
    setTitle('');
    // '' was typed on the way in, so useStableFieldValue will not remount on
    // its own; the box has to be remounted to clear in the host.
    setTitleKey((current) => current + 1);
  };

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
      <TaskTextInput
        key={titleKey}
        ariaLabel={t('New issue title')}
        value={title}
        onChange={setTitle}
        onEnter={submit}
        placeholder={t('New issue…')}
        width={220}
        prefixIcon={<IconPlus size={14} color={TASK_TOKENS.textTertiary} />}
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
