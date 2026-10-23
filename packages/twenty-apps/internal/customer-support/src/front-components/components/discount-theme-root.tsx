import 'twenty-ui/style.css';

import { type ReactNode } from 'react';
import { useColorScheme } from 'twenty-sdk/front-component';
import { ThemeProvider } from 'twenty-ui/theme';

import { DISCOUNT_TOKENS } from './discount-theme';

// Without twenty-ui's stylesheet and theme provider the --t-* variables are
// missing in the sandbox and every font and color falls back to the browser.
export const DiscountThemeRoot = ({ children }: { children: ReactNode }) => (
  <ThemeProvider colorScheme={useColorScheme()}>
    <div
      style={{
        color: DISCOUNT_TOKENS.textPrimary,
        fontFamily: DISCOUNT_TOKENS.fontFamily,
        fontSize: DISCOUNT_TOKENS.fontSizeMd,
        height: '100%',
        width: '100%',
      }}
    >
      {children}
    </div>
  </ThemeProvider>
);
