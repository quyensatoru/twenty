import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { PRODUCT_BACKLOG_ACCESS_ROUTE_PATH } from '../../../constants/product-backlog';
import { type CallerRole } from '../../../types/caller-scope';
import { TaskMessage } from '../../components/task-message';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import {
  PRODUCT_MUTED_STYLE,
  ProductCard,
  ProductCheckRow,
  ProductSectionLabel,
} from './product-ui';

type RoleAccess = {
  roles: CallerRole[];
  editorRoleIds: string[];
  hiddenRoleIds: string[];
};

type AccessResult = { success: true } & Partial<RoleAccess>;

const readAccess = (result: AccessResult): RoleAccess => ({
  roles: result.roles ?? [],
  editorRoleIds: result.editorRoleIds ?? [],
  hiddenRoleIds: result.hiddenRoleIds ?? [],
});

const toggle = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id];

export const ProductAccessSettings = ({ isMobile }: { isMobile: boolean }) => {
  const [access, setAccess] = useState<RoleAccess | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    postAppRoute<AccessResult>(PRODUCT_BACKLOG_ACCESS_ROUTE_PATH, {})
      .then((result) => setAccess(readAccess(result)))
      .catch((error: unknown) => setLoadError(readErrorText(error)));
  }, []);

  const save = async (next: RoleAccess) => {
    const previous = access;

    setAccess(next);

    try {
      await postAppRoute<AccessResult>(PRODUCT_BACKLOG_ACCESS_ROUTE_PATH, {
        editorRoleIds: next.editorRoleIds,
        hiddenRoleIds: next.hiddenRoleIds,
      });
    } catch (error) {
      setAccess(previous);
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    }
  };

  const roles = [...(access?.roles ?? [])].sort((left, right) =>
    left.label.localeCompare(right.label),
  );

  const renderColumn = (
    title: string,
    key: 'editorRoleIds' | 'hiddenRoleIds',
    otherKey: 'editorRoleIds' | 'hiddenRoleIds',
  ) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <ProductSectionLabel>{title}</ProductSectionLabel>
      {roles.map((role) => (
        <ProductCheckRow
          key={role.id}
          label={role.label}
          isChecked={access?.[key].includes(role.id) ?? false}
          onToggle={() =>
            access !== null &&
            void save({
              ...access,
              [key]: toggle(access[key], role.id),
              // A role is either an editor or hidden, never both.
              [otherKey]: access[otherKey].filter((id) => id !== role.id),
            })
          }
        />
      ))}
    </div>
  );

  return (
    <ProductCard title={t('Access by role')}>
      <span style={PRODUCT_MUTED_STYLE}>
        {t(
          'Applies to every project a person can open. Admins can always edit. Roles not ticked can view only.',
        )}
      </span>
      {loadError !== null ? (
        <TaskMessage text={loadError} tone="danger" />
      ) : access === null ? (
        <span style={PRODUCT_MUTED_STYLE}>{t('Loading roles…')}</span>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {renderColumn(t('Can edit'), 'editorRoleIds', 'hiddenRoleIds')}
          {renderColumn(t('Cannot see'), 'hiddenRoleIds', 'editorRoleIds')}
        </div>
      )}
    </ProductCard>
  );
};
