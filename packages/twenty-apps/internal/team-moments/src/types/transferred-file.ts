// What the host puts on a file input, `clipboardData.files` or
// `dataTransfer.files`: the file's metadata plus the handle standing in for
// its bytes.
export type TransferredFile = {
  name: string;
  size: number;
  type: string;
  handle?: string;
};
