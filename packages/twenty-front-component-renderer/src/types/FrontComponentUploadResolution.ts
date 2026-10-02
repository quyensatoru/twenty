// The guest's answer to an `upload` event: the handle it was given, and the URL
// it stored the file under. A null url means the guest could not store it, so
// the host component can stop waiting and drop its placeholder.
export type FrontComponentUploadResolution = {
  handle: string;
  url: string | null;
};
