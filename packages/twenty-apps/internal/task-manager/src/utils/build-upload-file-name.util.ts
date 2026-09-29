const MAX_UPLOAD_FILE_NAME_LENGTH = 120;

// The host sanitises and, when this is empty, invents a name from the mime
// type, so the only job here is to recover something recognisable from the
// pasted URL: its last path segment, without the query string it was signed or
// cache-busted with.
export const buildUploadFileName = (url: string): string => {
  const withoutQuery = url.split('?')[0].split('#')[0];
  const lastSegment = withoutQuery.split('/').filter(Boolean).pop() ?? '';

  let decodedSegment = lastSegment;

  try {
    decodedSegment = decodeURIComponent(lastSegment);
  } catch {
    // A half-escaped URL decodes to nothing useful; the raw segment still does.
  }

  return decodedSegment.slice(0, MAX_UPLOAD_FILE_NAME_LENGTH);
};
