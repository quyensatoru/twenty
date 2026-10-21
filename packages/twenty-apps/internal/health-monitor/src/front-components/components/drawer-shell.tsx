import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { useIsMobile } from '../hooks/use-is-mobile';
import { HEALTH_TOKENS, spacing } from './health-tokens';

type DrawerShellProps = {
  title: string;
  subtitle?: string;
  headerAside?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

// Twenty's side panel: no dimming, a border and a shadow over the page. On a
// phone it takes the whole screen.
export const DrawerShell = ({
  title,
  subtitle,
  headerAside,
  footer,
  onClose,
  children,
}: DrawerShellProps) => {
  const isMobile = useIsMobile();
  const gutter = isMobile ? spacing(3) : spacing(5);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div onClick={onClose} style={{ position: 'fixed', inset: 0 }} />
      <aside
        role="dialog"
        aria-label={title}
        style={{
          position: 'relative',
          zIndex: 61,
          width: '100%',
          maxWidth: isMobile ? '100%' : 760,
          height: '100%',
          background: HEALTH_TOKENS.backgroundSecondary,
          borderLeft: isMobile ? 'none' : `1px solid ${HEALTH_TOKENS.border}`,
          boxShadow: HEALTH_TOKENS.shadow,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing(3),
            padding: `${spacing(3)} ${gutter}`,
            background: HEALTH_TOKENS.background,
            borderBottom: `1px solid ${HEALTH_TOKENS.border}`,
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
          >
            <span
              style={{
                fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                fontSize: HEALTH_TOKENS.fontSizeLg,
              }}
            >
              {title}
            </span>
            {subtitle !== undefined && (
              <span
                style={{
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                  color: HEALTH_TOKENS.textSecondary,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing(3),
              flexShrink: 0,
            }}
          >
            {headerAside}
            <Button
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label={t('Close')}
              startIcon={<IconX size={16} />}
              onClick={onClose}
            />
          </div>
        </header>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: `${spacing(4)} ${gutter}`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(3.5),
          }}
        >
          {children}
        </div>
        {footer !== undefined && (
          <footer
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: spacing(2),
              padding: `${spacing(3)} ${gutter}`,
              background: HEALTH_TOKENS.background,
              borderTop: `1px solid ${HEALTH_TOKENS.border}`,
            }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
};
