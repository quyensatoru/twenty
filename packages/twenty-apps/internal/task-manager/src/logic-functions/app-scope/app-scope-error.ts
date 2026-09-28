export const APP_SCOPE_PERMISSION_DENIED = 'PERMISSION_DENIED';

// Thrown by every guard in this directory. Routes translate it into a
// `{ success: false, error }` body rather than letting it escape as a 500.
export class AppScopePermissionDeniedError extends Error {
  constructor(message: string = APP_SCOPE_PERMISSION_DENIED) {
    super(message);
    this.name = 'AppScopePermissionDeniedError';
  }
}

export const isAppScopePermissionDeniedError = (
  error: unknown,
): error is AppScopePermissionDeniedError =>
  error instanceof AppScopePermissionDeniedError;
