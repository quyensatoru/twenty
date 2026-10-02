import { useContext } from 'react';

import { FrontComponentHostImplementationsContext } from '@/host/component-implementations/contexts/FrontComponentHostImplementationsContext';
import {
  type FrontComponentHostImplementations,
  type FrontComponentHostImplementationTag,
} from '@/host/component-implementations/types/FrontComponentHostImplementations';

export const useFrontComponentHostImplementation = <
  TTag extends FrontComponentHostImplementationTag,
>(
  tag: TTag,
): FrontComponentHostImplementations[TTag] =>
  useContext(FrontComponentHostImplementationsContext)[tag];
