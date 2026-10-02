import { copyToClipboard, enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconLink } from 'twenty-ui/icon';

import { TaskIconButton } from './task-icon-button';

type TaskCopyLinkButtonProps = {
  url: string;
  label?: string;
  successMessage?: string;
};

// The host owns the clipboard: the sandbox has no navigator.clipboard, and the
// bridge deliberately suppresses its own success toast so the app can say what
// it copied.
export const TaskCopyLinkButton = ({
  url,
  label,
  successMessage,
}: TaskCopyLinkButtonProps) => (
  <TaskIconButton
    label={label ?? t('Copy link')}
    onClick={() => {
      void copyToClipboard(url).then(() =>
        enqueueSnackbar({
          message: successMessage ?? t('Link copied'),
          variant: 'success',
        }),
      );
    }}
  >
    <IconLink size={14} />
  </TaskIconButton>
);
