import { useEffect } from 'react';

import { SIDE_PANEL_WIDTH_VAR } from '@/side-panel/states/sidePanelWidthState';

type SidePanelWidthEffectProps = {
  width: number;
};

export const SidePanelWidthEffect = ({ width }: SidePanelWidthEffectProps) => {
  useEffect(() => {
    document.documentElement.style.setProperty(
      SIDE_PANEL_WIDTH_VAR,
      `${width}px`,
    );
  }, [width]);

  return null;
};
