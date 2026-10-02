import { useFrontComponentExecutionContext } from './useFrontComponentExecutionContext';

export const useLocationHash = (): string =>
  useFrontComponentExecutionContext((context) => context.locationHash ?? '');
