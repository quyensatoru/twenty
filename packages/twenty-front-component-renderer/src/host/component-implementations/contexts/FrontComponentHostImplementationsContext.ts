import { createContext } from 'react';

import { type FrontComponentHostImplementations } from '@/host/component-implementations/types/FrontComponentHostImplementations';

export const FrontComponentHostImplementationsContext =
  createContext<FrontComponentHostImplementations>({});
