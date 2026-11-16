import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconUsers } from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';

import { type BcContextResult } from '../../types/bc-context';
import { BC_TOKENS, spacing } from './bc-theme';

// The page title row, like Twenty's record index header: icon, title, a
// scope chip and the page actions on the right.
export const BcPageHeader = ({
  icon,
  title,
  scopeLabel,
  actions,
  isMobile,
}: {
  icon: ReactNode;
  title: string;
  scopeLabel?: string;
  actions?: ReactNode;
  isMobile: boolean;
}) => (
  <header
    style={{
      alignItems: 'center',
      background: BC_TOKENS.background,
      borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
      boxSizing: 'border-box',
      display: 'flex',
      flexShrink: 0,
      flexWrap: 'wrap',
      gap: spacing(2),
      justifyContent: 'space-between',
      minHeight: 48,
      padding: `${spacing(1)} ${isMobile ? spacing(3) : spacing(4)}`,
    }}
  >
    <div style={{ alignItems: 'center', display: 'flex', gap: spacing(2), minWidth: 0 }}>
      <span style={{ color: BC_TOKENS.textTertiary, display: 'inline-flex' }}>{icon}</span>
      <span
        style={{
          fontSize: BC_TOKENS.fontSizeLg,
          fontWeight: BC_TOKENS.fontWeightSemiBold,
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      {scopeLabel !== undefined && (
        <span
          style={{
            alignItems: 'center',
            background: BC_TOKENS.backgroundTertiary,
            borderRadius: BC_TOKENS.radiusSmall,
            color: BC_TOKENS.textSecondary,
            display: 'inline-flex',
            fontSize: BC_TOKENS.fontSizeSm,
            gap: spacing(1),
            height: 20,
            padding: `0 ${spacing(1.5)}`,
            whiteSpace: 'nowrap',
          }}
        >
          <IconUsers size={12} />
          {scopeLabel}
        </span>
      )}
    </div>
    {actions !== undefined && (
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2) }}>
        {actions}
      </div>
    )}
  </header>
);

export const readScopeLabel = (context: BcContextResult | null): string | undefined => {
  if (context === null) {
    return undefined;
  }

  switch (context.scope.role) {
    case 'ADMIN':
      return t('All teams');
    case 'MANAGER':
      return t('My team');
    case 'BC':
      return t('My clients');
    default:
      return undefined;
  }
};

// Shown instead of the page body to someone who is in no BC team.
export const NoBcAccess = () => (
  <div style={{ padding: spacing(4) }}>
    <Banner color="blue" variant="secondary">
      {t('You are not in a BC team yet. Ask a workspace admin to add you in BC Workspace settings.')}
    </Banner>
  </div>
);

export const EmptyState = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      color: BC_TOKENS.textTertiary,
      padding: spacing(8),
      textAlign: 'center',
    }}
  >
    {children}
  </div>
);
