import { type CallerRole } from '../types/caller-scope';

export type ProductBacklogAccess = 'EDIT' | 'VIEW' | 'NONE';

// A setting lists roles by id (saved from the Settings tab) or by name (the
// manifest default, since role ids differ per workspace).
export const readProductBacklogRoleEntries = (
  value: string | null | undefined,
): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

export const isRoleListed = (role: CallerRole, entries: string[]): boolean =>
  entries.some(
    (entry) =>
      entry === role.id ||
      entry.toLowerCase() === role.label.trim().toLowerCase(),
  );

// Hidden wins over editor, so a person holding both roles is kept out.
export const readProductBacklogAccess = ({
  roles,
  canBypassAppScope,
  editorRoles,
  hiddenRoles,
}: {
  roles: readonly CallerRole[];
  canBypassAppScope: boolean;
  editorRoles: string | null | undefined;
  hiddenRoles: string | null | undefined;
}): ProductBacklogAccess => {
  if (canBypassAppScope) {
    return 'EDIT';
  }

  const hasAnyOf = (value: string | null | undefined) => {
    const entries = readProductBacklogRoleEntries(value);

    return roles.some((role) => isRoleListed(role, entries));
  };

  if (hasAnyOf(hiddenRoles)) {
    return 'NONE';
  }

  return hasAnyOf(editorRoles) ? 'EDIT' : 'VIEW';
};
