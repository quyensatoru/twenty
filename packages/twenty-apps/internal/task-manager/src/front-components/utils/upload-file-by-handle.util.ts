import type { UploadFileParams, UploadFileResult } from 'twenty-sdk/front-component';

// A file the user pasted or dropped never crosses into the sandbox: the host
// keeps the real File and sends a single-use handle instead. The host function
// that spends it lives on the same global the SDK's own wrappers read, and is
// reached that way here because the published twenty-sdk this app builds
// against predates `uploadFileByHandle`. Once a release exports it, this whole
// file becomes `import { uploadFileByHandle } from 'twenty-sdk/front-component'`.
const FRONT_COMPONENT_HOST_COMMUNICATION_API_KEY =
  'frontComponentHostCommunicationApi';

type UploadFileByHandleFunction = (
  handle: string,
  params: UploadFileParams,
) => Promise<UploadFileResult>;

type HostCommunicationApi = {
  uploadFileByHandle?: UploadFileByHandleFunction;
};

const readHostCommunicationApi = (): HostCommunicationApi | undefined => {
  const api = (globalThis as Record<string, unknown>)[
    FRONT_COMPONENT_HOST_COMMUNICATION_API_KEY
  ];

  return typeof api === 'object' && api !== null
    ? (api as HostCommunicationApi)
    : undefined;
};

export const isUploadFileByHandleAvailable = (): boolean =>
  typeof readHostCommunicationApi()?.uploadFileByHandle === 'function';

export const uploadFileByHandle = async (
  handle: string,
  params: UploadFileParams,
): Promise<UploadFileResult> => {
  const uploadFileByHandleFunction =
    readHostCommunicationApi()?.uploadFileByHandle;

  if (typeof uploadFileByHandleFunction !== 'function') {
    return { status: 'failed', reason: 'upload-failed' };
  }

  return uploadFileByHandleFunction(handle, params);
};
