import { useFrontComponentExecutionContext } from 'twenty-sdk/front-component';

// The host's own mobile breakpoint. A front component's worker has no window
// to measure and cannot ship a media query, so the host reports it. Cast: the
// published SDK's context type predates the field; drop it once the app moves
// to an SDK that declares it.
export const useIsMobile = (): boolean =>
  useFrontComponentExecutionContext(
    (context) => (context as { isMobile?: boolean }).isMobile === true,
  );
