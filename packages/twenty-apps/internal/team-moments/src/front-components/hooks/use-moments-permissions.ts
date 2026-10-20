import { useEffect, useState } from 'react';

import {
  type MomentsPermissions,
  NO_MOMENTS_PERMISSIONS,
  resolveMomentsPermissions,
} from '../utils/resolve-moments-permissions.util';

export const useMomentsPermissions = (): MomentsPermissions => {
  const [permissions, setPermissions] = useState<MomentsPermissions>(NO_MOMENTS_PERMISSIONS);

  useEffect(() => {
    let isActive = true;

    resolveMomentsPermissions()
      .then((resolved) => {
        if (isActive) {
          setPermissions(resolved);
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

  return permissions;
};
