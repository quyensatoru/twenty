export type SerializedFileData = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  // Set for a pasted or dropped file only; spend it through uploadFileByHandle.
  handle?: string;
};
