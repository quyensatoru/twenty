import { isDefined } from 'twenty-shared/utils';

import {
  type UploadFileByHandleFunction,
  frontComponentHostCommunicationApi,
} from '../globals/frontComponentHostCommunicationApi';

export const uploadFileByHandle: UploadFileByHandleFunction = (
  handle,
  params,
) => {
  const uploadFileByHandleFunction =
    frontComponentHostCommunicationApi.uploadFileByHandle;

  if (!isDefined(uploadFileByHandleFunction)) {
    throw new Error('uploadFileByHandleFunction is not set');
  }

  return uploadFileByHandleFunction(handle, params);
};
