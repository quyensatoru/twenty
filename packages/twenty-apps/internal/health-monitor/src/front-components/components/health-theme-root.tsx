import 'twenty-ui/style.css';

import { type ReactNode } from 'react';
import { useColorScheme } from 'twenty-sdk/front-component';
import { ThemeProvider } from 'twenty-ui/theme';

import { HEALTH_TOKENS } from './health-tokens';

export const HealthThemeRoot = ({ children }: { children: ReactNode }) => (
  <ThemeProvider colorScheme={useColorScheme()}>
    <div
      style={{
        fontFamily: HEALTH_TOKENS.fontFamily,
        fontSize: HEALTH_TOKENS.fontSizeMd,
        color: HEALTH_TOKENS.textPrimary,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {children}
    </div>
  </ThemeProvider>
);
