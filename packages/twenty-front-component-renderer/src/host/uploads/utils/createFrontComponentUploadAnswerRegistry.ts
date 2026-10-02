import { isDefined } from 'twenty-shared/utils';

import { type FrontComponentUploadResolution } from '@/types/FrontComponentUploadResolution';

// A guest that never answers must not leave a host component showing a file as
// forever half arrived. Matched to the transferred file stash's own lifetime:
// past it the handle no longer names anything anyway.
const UPLOAD_ANSWER_TIMEOUT_MS = 60_000;

export type FrontComponentUploadAnswerRegistry = {
  waitForAnswer: (handle: string) => Promise<string | null>;
  applyResolutions: (resolutions: FrontComponentUploadResolution[]) => void;
  abandonAll: () => void;
};

// Holds the host side of an upload round trip: a host component hands the
// guest a file handle and waits here until the guest answers with the URL it
// stored the file under. Handles are matched one by one because several files
// can be in flight and they come back in whatever order they upload in.
export const createFrontComponentUploadAnswerRegistry =
  (): FrontComponentUploadAnswerRegistry => {
    const pendingAnswerByHandle = new Map<
      string,
      (url: string | null) => void
    >();

    const waitForAnswer = (handle: string): Promise<string | null> =>
      new Promise<string | null>((resolve) => {
        const settle = (url: string | null) => {
          clearTimeout(timeoutHandle);
          pendingAnswerByHandle.delete(handle);
          resolve(url);
        };

        const timeoutHandle = setTimeout(
          () => settle(null),
          UPLOAD_ANSWER_TIMEOUT_MS,
        );

        pendingAnswerByHandle.set(handle, settle);
      });

    // Resolutions the guest already answered stay in its list, so a handle
    // that is no longer pending is simply one this registry has settled.
    const applyResolutions = (
      resolutions: FrontComponentUploadResolution[],
    ): void => {
      for (const resolution of resolutions) {
        const settle = pendingAnswerByHandle.get(resolution.handle);

        if (isDefined(settle)) {
          settle(resolution.url);
        }
      }
    };

    const abandonAll = (): void => {
      for (const settle of [...pendingAnswerByHandle.values()]) {
        settle(null);
      }
    };

    return { waitForAnswer, applyResolutions, abandonAll };
  };
