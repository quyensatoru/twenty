import type { UploadFileParams, UploadFileResult } from 'twenty-sdk/front-component';

// A picked, pasted or dropped file never crosses into the sandbox: the host
// keeps the real File and hands over a single-use handle. The host function
// that spends it is read from the global the SDK's own wrappers use, because
// the published twenty-sdk this app builds against predates
// `uploadFileByHandle`.
const FRONT_COMPONENT_HOST_COMMUNICATION_API_KEY = 'frontComponentHostCommunicationApi';

type UploadFileByHandleFunction = (handle: string, params: UploadFileParams) => Promise<UploadFileResult>;

const readUploadFileByHandle = (): UploadFileByHandleFunction | undefined => {
  const api = (globalThis as Record<string, unknown>)[FRONT_COMPONENT_HOST_COMMUNICATION_API_KEY];
  const candidate = typeof api === 'object' && api !== null ? (api as { uploadFileByHandle?: unknown }).uploadFileByHandle : undefined;

  return typeof candidate === 'function' ? (candidate as UploadFileByHandleFunction) : undefined;
};

export const isUploadFileByHandleAvailable = (): boolean => readUploadFileByHandle() !== undefined;

export const uploadFileByHandle = async (handle: string, params: UploadFileParams): Promise<UploadFileResult> => {
  const upload = readUploadFileByHandle();

  if (upload === undefined) {
    return { status: 'failed', reason: 'upload-failed' };
  }

  return upload(handle, params);
};
