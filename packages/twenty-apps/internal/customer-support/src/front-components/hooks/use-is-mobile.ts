import { useFrontComponentExecutionContext } from 'twenty-sdk/front-component';

// The host's own mobile breakpoint: a front component's worker has no window
// to measure. Cast: the published SDK's context type predates the field.
export const useIsMobile = (): boolean =>
  useFrontComponentExecutionContext(
    (context) => (context as { isMobile?: boolean }).isMobile === true,
  );
