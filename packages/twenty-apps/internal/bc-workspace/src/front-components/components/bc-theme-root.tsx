import 'twenty-ui/style.css';

import { type ReactNode } from 'react';
import { useColorScheme } from 'twenty-sdk/front-component';
import { ThemeProvider } from 'twenty-ui/theme';

import { BC_TOKENS } from './bc-theme';

// Without the provider and the stylesheet the sandbox has no --t-* variables
// and twenty-ui renders with browser defaults.
export const BcThemeRoot = ({ children }: { children: ReactNode }) => (
  <ThemeProvider colorScheme={useColorScheme()}>
    <div
      style={{
        color: BC_TOKENS.textPrimary,
        fontFamily: BC_TOKENS.fontFamily,
        fontSize: BC_TOKENS.fontSizeMd,
        fontVariantNumeric: 'tabular-nums',
        height: '100%',
        // Pages scroll inside their own regions; a wide table must never
        // widen the widget and push the header or cards past its edge.
        maxWidth: '100%',
        minWidth: 0,
        overflowX: 'hidden',
        width: '100%',
      }}
    >
      {children}
    </div>
  </ThemeProvider>
);
