import { isString } from '@sniptt/guards';
import { isDefined, isPlainObject } from 'twenty-shared/utils';

import { applyEventModifierKeys } from '@/host/events/utils/applyEventModifierKeys';
import { applyEventTargetProperties } from '@/host/events/utils/applyEventTargetProperties';
import { applyInputEventProperties } from '@/host/events/utils/applyInputEventProperties';
import { applyKeyboardEventProperties } from '@/host/events/utils/applyKeyboardEventProperties';
import { applyMouseEventProperties } from '@/host/events/utils/applyMouseEventProperties';
import { applyPointerEventProperties } from '@/host/events/utils/applyPointerEventProperties';
import { applyWheelEventProperties } from '@/host/events/utils/applyWheelEventProperties';
import { serializeTransferredFileList } from '@/host/events/utils/serializeTransferredFileList';
import { type SerializedEventData } from '@/types/SerializedEventData';

type SerializeEventOptions = {
  includesFormControlState: boolean;
};

export const serializeEvent = (
  domEvent: unknown,
  { includesFormControlState }: SerializeEventOptions = {
    includesFormControlState: true,
  },
): SerializedEventData => {
  if (!isPlainObject(domEvent)) {
    return { type: 'unknown' };
  }

  const serializedEvent: SerializedEventData = {
    type: isString(domEvent.type) ? domEvent.type : 'unknown',
  };

  applyEventModifierKeys({ serializedEvent, domEvent });
  applyMouseEventProperties({ serializedEvent, domEvent });
  applyPointerEventProperties({ serializedEvent, domEvent });
  applyKeyboardEventProperties({ serializedEvent, domEvent });
  applyInputEventProperties({ serializedEvent, domEvent });
  applyWheelEventProperties({ serializedEvent, domEvent });
  applyEventTargetProperties({
    serializedEvent,
    target: domEvent.target,
    includesFormControlState,
  });

  // Fork-only: paste/drop carry files behind transfer objects and file
  // inputs need stash handles for uploadFileByHandle, neither of which
  // upstream's pipeline extracts.
  const transferredFiles = serializeTransferredFileList(
    domEvent,
    serializedEvent.type,
  );
  if (isDefined(transferredFiles)) {
    serializedEvent.files = transferredFiles;
  }

  return serializedEvent;
};
