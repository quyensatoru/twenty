import { type CustomSettingFileValue } from '../types/custom-setting-schema';

// The stored reference keeps the name split the way the fork did: `label` is
// what the form prints, `extension` is what tells a CSV from a ZIP without
// parsing the URL. A name with no dot keeps an empty extension rather than
// swallowing the whole name.
export const buildCustomSettingFileValue = ({
  fileId,
  fileName,
  url,
}: {
  fileId: string;
  fileName: string;
  url: string;
}): CustomSettingFileValue => {
  const lastDotIndex = fileName.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;

  return {
    fileId,
    label: hasExtension ? fileName.slice(0, lastDotIndex) : fileName,
    extension: hasExtension ? fileName.slice(lastDotIndex + 1) : '',
    url,
  };
};

export const formatCustomSettingFileName = (
  file: CustomSettingFileValue,
): string =>
  file.extension.length > 0 ? `${file.label}.${file.extension}` : file.label;
