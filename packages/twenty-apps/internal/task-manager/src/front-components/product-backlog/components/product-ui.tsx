import { type CSSProperties, type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconAlertTriangle, IconProgressCheck } from 'twenty-ui/icon';

import { type ScoredProductItem } from '../../../utils/product-backlog/prioritization-templates.util';
import { formatTemplateScore } from '../../../utils/product-backlog/prioritization-templates.util';
import { type PrioritizationTemplate } from '../../../utils/product-backlog/prioritization-template.util';
import { TaskCheckbox } from '../../components/task-checkbox';
import { getTaskControlStyle } from '../../components/task-control-styles';
import { TaskTextInput } from '../../components/task-text-input';
import {
  readTagColor,
  TASK_CIRCLE_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';

export type ProductTone = 'good' | 'warning' | 'danger';

export const PRODUCT_TONE_COLOR: Record<ProductTone, string> = {
  good: readTagColor('green').text,
  warning: readTagColor('orange').text,
  danger: TASK_TOKENS.textDanger,
};

export const PRODUCT_TEXT_STYLE: CSSProperties = {
  color: TASK_TOKENS.textPrimary,
  fontFamily: TASK_TOKENS.fontFamily,
  fontSize: 13,
};

export const PRODUCT_MUTED_STYLE: CSSProperties = {
  color: TASK_TOKENS.textTertiary,
  fontFamily: TASK_TOKENS.fontFamily,
  fontSize: 12,
};

type ProductCardProps = {
  title?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
};

export const ProductCard = ({
  title,
  trailing,
  children,
  style,
}: ProductCardProps) => (
  <section
    style={{
      background: TASK_TOKENS.background,
      border: `1px solid ${TASK_TOKENS.border}`,
      borderRadius: TASK_TOKENS.radius,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      ...style,
    }}
  >
    {title !== undefined && (
      <header
        style={{
          ...PRODUCT_TEXT_STYLE,
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
          display: 'flex',
          flexWrap: 'wrap',
          fontWeight: 600,
          gap: 8,
          minHeight: 40,
          padding: '6px 14px',
        }}
      >
        {title}
        {trailing !== undefined && (
          <>
            <span style={{ flex: 1 }} />
            {trailing}
          </>
        )}
      </header>
    )}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        padding: 14,
      }}
    >
      {children}
    </div>
  </section>
);

export const ProductSectionLabel = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      ...PRODUCT_MUTED_STYLE,
      fontWeight: 600,
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

type ProductCommitTextInputProps = {
  value: string;
  onCommit: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  width?: number | string;
  type?: 'text' | 'number' | 'date';
  isDisabled?: boolean;
  // Cleared after a commit, for the "type and press Enter to add" rows.
  shouldClearOnCommit?: boolean;
};

// Saves on Enter or blur, never per keystroke: each save is a round trip, and
// a keystroke-by-keystroke write would race its own echo.
export const ProductCommitTextInput = ({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  width = '100%',
  type = 'text',
  isDisabled = false,
  shouldClearOnCommit = false,
}: ProductCommitTextInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [clearKey, setClearKey] = useState(0);

  const commit = (next: string) => {
    setDraft(null);

    if (next !== value && (!shouldClearOnCommit || next.trim() !== '')) {
      onCommit(next);
    }

    if (shouldClearOnCommit) {
      setClearKey((key) => key + 1);
    }
  };

  if (isDisabled) {
    return (
      <span style={{ ...PRODUCT_TEXT_STYLE, minHeight: 20 }}>
        {value === '' ? (
          <span style={{ color: TASK_TOKENS.textLight }}>{placeholder}</span>
        ) : (
          value
        )}
      </span>
    );
  }

  return (
    <TaskTextInput
      key={clearKey}
      value={draft ?? value}
      onChange={setDraft}
      onEnter={commit}
      onBlur={(next) => {
        if (!shouldClearOnCommit) {
          commit(next);
        }
      }}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      width={width}
      type={type}
      height={30}
    />
  );
};

type ProductTextAreaProps = {
  value: string;
  onCommit: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  minHeight?: number;
  isDisabled?: boolean;
};

export const ProductTextArea = ({
  value,
  onCommit,
  ariaLabel,
  placeholder,
  minHeight = 56,
  isDisabled = false,
}: ProductTextAreaProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <textarea
      aria-label={ariaLabel}
      value={draft ?? value}
      placeholder={placeholder}
      disabled={isDisabled}
      onFocus={() => setIsFocused(true)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        setIsFocused(false);
        setDraft(null);

        if (event.target.value !== value) {
          onCommit(event.target.value);
        }
      }}
      style={{
        ...getTaskControlStyle(isFocused),
        ...PRODUCT_TEXT_STYLE,
        boxSizing: 'border-box',
        minHeight,
        padding: 8,
        resize: 'vertical',
        width: '100%',
      }}
    />
  );
};

type ProductCheckRowProps = {
  label: ReactNode;
  isChecked: boolean;
  onToggle?: () => void;
  // Worked out from the item's data: shown, never ticked by hand.
  isAutomatic?: boolean;
  trailing?: ReactNode;
};

export const ProductCheckRow = ({
  label,
  isChecked,
  onToggle,
  isAutomatic = false,
  trailing,
}: ProductCheckRowProps) => {
  const isInteractive = onToggle !== undefined && !isAutomatic;

  return (
    <button
      type="button"
      disabled={!isInteractive}
      onClick={onToggle}
      title={isAutomatic ? t('Checked automatically from the item') : undefined}
      style={{
        ...PRODUCT_TEXT_STYLE,
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        cursor: isInteractive ? 'pointer' : 'default',
        display: 'flex',
        gap: 8,
        opacity: isAutomatic && !isChecked ? 0.75 : 1,
        padding: '3px 0',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <TaskCheckbox isChecked={isChecked} />
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {isAutomatic && <span style={PRODUCT_MUTED_STYLE}>{t('automatic')}</span>}
      {trailing}
    </button>
  );
};

type ProductKpiProps = {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: ProductTone;
  onClick?: () => void;
};

export const ProductKpi = ({
  label,
  value,
  note,
  tone,
  onClick,
}: ProductKpiProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      disabled={onClick === undefined}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={
        onClick === undefined ? undefined : t('Show these items in the list')
      }
      style={{
        alignItems: 'flex-start',
        background:
          onClick !== undefined && isHovered
            ? TASK_TOKENS.backgroundHover
            : TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        cursor: onClick === undefined ? 'default' : 'pointer',
        display: 'flex',
        flex: '1 1 180px',
        flexDirection: 'column',
        fontFamily: TASK_TOKENS.fontFamily,
        gap: 4,
        minWidth: 0,
        padding: '12px 14px',
        textAlign: 'left',
      }}
    >
      <span style={PRODUCT_MUTED_STYLE}>{label}</span>
      <span
        style={{
          color: TASK_TOKENS.textPrimary,
          fontSize: 18,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
        }}
      >
        {value}
      </span>
      {note !== undefined && (
        <span
          style={{
            ...PRODUCT_MUTED_STYLE,
            alignItems: 'center',
            color:
              tone === undefined
                ? TASK_TOKENS.textTertiary
                : PRODUCT_TONE_COLOR[tone],
            display: 'flex',
            gap: 4,
          }}
        >
          {tone === 'good' && <IconProgressCheck size={13} />}
          {tone !== undefined && tone !== 'good' && (
            <IconAlertTriangle size={13} />
          )}
          {note}
        </span>
      )}
    </button>
  );
};

export type ProductBarRow = {
  label: string;
  value: number;
  color: string;
  note?: string;
};

export const ProductBarList = ({
  rows,
}: {
  rows: readonly ProductBarRow[];
}) => {
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (rows.length === 0) {
    return <span style={PRODUCT_MUTED_STYLE}>{t('Nothing to show yet.')}</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            alignItems: 'center',
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'minmax(0, 150px) 1fr 64px',
          }}
        >
          <span
            title={row.label}
            style={{
              ...PRODUCT_TEXT_STYLE,
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.label}
          </span>
          <span
            style={{
              background: TASK_TOKENS.backgroundTertiary,
              borderRadius: 3,
              height: 8,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                background: row.color,
                borderRadius: 3,
                display: 'block',
                height: '100%',
                width: `${(row.value / max) * 100}%`,
              }}
            />
          </span>
          <span
            style={{
              ...PRODUCT_MUTED_STYLE,
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
            }}
          >
            {row.note === undefined ? row.value : `${row.value} ${row.note}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ProductReadinessDot = ({ percent }: { percent: number }) => {
  const color =
    percent === 100
      ? readTagColor('green').text
      : percent >= 60
        ? readTagColor('orange').text
        : TASK_TOKENS.textLight;

  return (
    <span
      title={t('Definition of Ready: {percent}%', { percent })}
      style={{
        ...TASK_CIRCLE_STYLE,
        background: percent === 100 ? color : 'transparent',
        border: `2px solid ${color}`,
        boxSizing: 'border-box',
        display: 'inline-block',
        flexShrink: 0,
        height: 10,
        width: 10,
      }}
    />
  );
};

type ProductScoreBadgeProps = {
  scored: ScoredProductItem;
  template: PrioritizationTemplate;
};

export const ProductScoreBadge = ({
  scored,
  template,
}: ProductScoreBadgeProps) => {
  if (scored.score === null) {
    return (
      <span
        title={t('Not scored with {template}', { template: template.name })}
        style={{ ...PRODUCT_MUTED_STYLE, width: 56, textAlign: 'center' }}
      >
        —
      </span>
    );
  }

  const color = readTagColor(scored.classification?.color ?? 'gray');
  const text = formatTemplateScore(template, scored.score);

  return (
    <span
      title={
        scored.classification === null
          ? template.name
          : t(scored.classification.label)
      }
      style={{
        alignItems: 'center',
        background: color.background,
        borderRadius: TASK_TOKENS.radiusExtraSmall,
        color: color.text,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 500,
        gap: 4,
        height: 20,
        justifyContent: 'center',
        maxWidth: 140,
        minWidth: 40,
        overflow: 'hidden',
        padding: '0 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {text === '' ? t(scored.classification?.label ?? '') : text}
    </span>
  );
};

export const ProductWarning = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      ...PRODUCT_TEXT_STYLE,
      alignItems: 'flex-start',
      background: readTagColor('orange').background,
      borderRadius: TASK_TOKENS.radiusSmall,
      color: readTagColor('orange').text,
      display: 'flex',
      fontSize: 12,
      gap: 6,
      padding: '6px 10px',
    }}
  >
    <IconAlertTriangle size={14} />
    <span>{children}</span>
  </div>
);

export const ProductEmpty = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: '48px 16px',
      textAlign: 'center',
    }}
  >
    <span style={{ ...PRODUCT_TEXT_STYLE, fontWeight: 600 }}>{title}</span>
    {description !== undefined && (
      <span style={{ ...PRODUCT_MUTED_STYLE, maxWidth: 420 }}>
        {description}
      </span>
    )}
  </div>
);

type ProductSignalRowProps = {
  tone: ProductTone;
  text: string;
  action?: ReactNode;
};

export const ProductSignalRow = ({
  tone,
  text,
  action,
}: ProductSignalRowProps) => (
  <div
    style={{
      ...PRODUCT_TEXT_STYLE,
      alignItems: 'flex-start',
      borderLeft: `3px solid ${PRODUCT_TONE_COLOR[tone]}`,
      display: 'flex',
      gap: 8,
      padding: '6px 10px',
    }}
  >
    <span
      style={{
        color: PRODUCT_TONE_COLOR[tone],
        display: 'inline-flex',
        paddingTop: 1,
      }}
    >
      {tone === 'good' ? (
        <IconProgressCheck size={15} />
      ) : (
        <IconAlertTriangle size={15} />
      )}
    </span>
    <span style={{ flex: 1 }}>{text}</span>
    {action}
  </div>
);
