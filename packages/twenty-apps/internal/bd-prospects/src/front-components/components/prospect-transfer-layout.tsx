import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconAlertCircle, IconCheck, IconTable } from 'twenty-ui/icon';

import {
  PROSPECT_SCROLL_STYLE,
  PROSPECT_TOKENS as TOKENS,
} from './prospect-ui-tokens';

type ProspectTransferLayoutProps = {
  title: string;
  description: string;
  icon: ReactNode;
  actions: ReactNode;
  children: ReactNode;
};

export const ProspectTransferLayout = ({
  title,
  description,
  icon,
  actions,
  children,
}: ProspectTransferLayoutProps) => (
  <main
    aria-label={title}
    style={{
      background: TOKENS.background,
      boxSizing: 'border-box',
      color: TOKENS.text,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TOKENS.fontFamily,
      fontSize: 13,
      height: '100%',
      minHeight: 0,
      width: '100%',
    }}
  >
    <header
      style={{
        borderBottom: `1px solid ${TOKENS.border}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          maxWidth: 1120,
          margin: '0 auto',
          padding: '12px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{ color: TOKENS.secondary, display: 'flex' }}
          >
            {icon}
          </span>
          <span
            style={{ color: TOKENS.secondary, fontSize: 13, lineHeight: 1.5 }}
          >
            {description}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      </div>
    </header>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        ...PROSPECT_SCROLL_STYLE,
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: 1120,
          padding: '20px 24px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  </main>
);

type ProspectSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export const ProspectSection = ({
  title,
  description,
  icon,
  action,
  children,
}: ProspectSectionProps) => (
  <section
    style={{
      borderBottom: `1px solid ${TOKENS.borderLight}`,
      minWidth: 0,
      paddingBottom: 16,
    }}
  >
    <header
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 8,
        justifyContent: 'space-between',
        minHeight: 36,
        padding: '0 0 8px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h2
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {icon && (
            <span
              aria-hidden="true"
              style={{ color: TOKENS.muted, display: 'flex' }}
            >
              {icon}
            </span>
          )}
          {title}
        </h2>
        {description && (
          <p
            style={{
              color: TOKENS.muted,
              fontSize: 12,
              lineHeight: 1.5,
              margin: '5px 0 0',
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
    <div>{children}</div>
  </section>
);

type ProspectNoticeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'danger' | 'success';
};
export const ProspectNotice = ({
  children,
  tone = 'neutral',
}: ProspectNoticeProps) => (
  <div
    role={tone === 'danger' ? 'alert' : tone === 'success' ? 'status' : 'note'}
    style={{
      alignItems: 'flex-start',
      background: TOKENS.subtle,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: TOKENS.radiusSmall,
      color:
        tone === 'danger'
          ? TOKENS.danger
          : tone === 'success'
            ? TOKENS.success
            : TOKENS.secondary,
      display: 'flex',
      fontSize: 12,
      gap: 8,
      lineHeight: 1.6,
      padding: '10px 12px',
    }}
  >
    <span
      aria-hidden="true"
      style={{ display: 'flex', flexShrink: 0, paddingTop: 2 }}
    >
      {tone === 'success' ? (
        <IconCheck size={15} />
      ) : (
        <IconAlertCircle size={15} />
      )}
    </span>
    <div>{children}</div>
  </div>
);

type ProspectPreviewTableProps = {
  columns: string[];
  rows: string[][];
  emptyTitle?: string;
  emptyDescription?: string;
};
export const ProspectPreviewTable = ({
  columns,
  rows,
  emptyTitle = t('No results yet'),
  emptyDescription = t('Your preview will appear here.'),
}: ProspectPreviewTableProps) =>
  rows.length === 0 ? (
    <div
      style={{
        alignItems: 'center',
        background: TOKENS.subtle,
        border: `1px solid ${TOKENS.borderLight}`,
        borderRadius: TOKENS.radiusSmall,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <IconTable size={24} color={TOKENS.muted} />
      <p style={{ fontWeight: 500, margin: 0 }}>{emptyTitle}</p>
      <p
        style={{
          color: TOKENS.muted,
          fontSize: 12,
          margin: 0,
          lineHeight: 1.6,
          maxWidth: 340,
        }}
      >
        {emptyDescription}
      </p>
    </div>
  ) : (
    <div
      style={{
        overflowX: 'auto',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: TOKENS.radiusSmall,
        ...PROSPECT_SCROLL_STYLE,
      }}
    >
      <table
        style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}
      >
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={`${index}-${column}`}
                scope="col"
                style={{
                  background: TOKENS.subtle,
                  borderBottom: `1px solid ${TOKENS.border}`,
                  color: TOKENS.secondary,
                  fontWeight: 500,
                  height: 34,
                  padding: '0 12px',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((value, columnIndex) => (
                <td
                  key={columnIndex}
                  style={{
                    borderBottom:
                      index === rows.length - 1
                        ? 'none'
                        : `1px solid ${TOKENS.borderLight}`,
                    color: value === '' ? TOKENS.muted : TOKENS.text,
                    height: 36,
                    maxWidth: 280,
                    overflow: 'hidden',
                    padding: '0 12px',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={value}
                >
                  {value || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

export const ProspectLoadingState = ({ label }: { label: string }) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      background: TOKENS.subtle,
      border: `1px solid ${TOKENS.border}`,
      borderRadius: TOKENS.radius,
      padding: 20,
    }}
  >
    <p style={{ color: TOKENS.secondary, fontSize: 12, margin: '0 0 16px' }}>
      {label}
    </p>
    {[80, 100, 60].map((width, index) => (
      <div
        key={width}
        aria-hidden="true"
        style={{
          background: TOKENS.tertiary,
          borderRadius: TOKENS.radiusExtraSmall,
          height: 8,
          marginTop: index === 0 ? 0 : 12,
          width: `${width}%`,
        }}
      />
    ))}
  </div>
);
