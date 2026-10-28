import { useFrontComponentExecutionContext } from 'twenty-sdk/front-component';

type HostLocation = { pathname: string; hash: string };

// The pinned SDK's context type predates `location`; the host sends it.
const readHostLocation = (context: unknown): HostLocation | null =>
  (context as { location?: HostLocation | null }).location ?? null;

// Raw `location.hash`: keeps the leading '#' and is not URI-decoded.
export const useHostLocationHash = (): string =>
  useFrontComponentExecutionContext(
    (context) => readHostLocation(context)?.hash ?? '',
  );

export const useHostLocationPathname = (): string =>
  useFrontComponentExecutionContext(
    (context) => readHostLocation(context)?.pathname ?? '',
  );
