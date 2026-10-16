import { type ReactNode, useMemo, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFilter,
  IconSearch,
} from 'twenty-ui/icon';

import { TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

export type TaskFilterMenuOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type TaskFilterMenuField = {
  key: string;
  label: string;
  icon: ReactNode;
  options: readonly TaskFilterMenuOption[];
  selectedValues: readonly string[];
  // Several values combine with OR and keep the menu open; a single-value
  // field replaces its value and closes.
  isMulti: boolean;
  onToggle: (value: string) => void;
};

type TaskFilterMenuProps = {
  fields: readonly TaskFilterMenuField[];
  isCompact?: boolean;
};

const MENU_WIDTH = 240;
const TRIGGER_HEIGHT = 28;

// One "Filter" button in place of a select per field. Both levels draw inside
// the same overlay: a second overlay opened from this one would count as an
// outside click and close it.
export const TaskFilterMenu = ({
  fields,
  isCompact = false,
}: TaskFilterMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const activeField =
    fields.find((field) => field.key === activeFieldKey) ?? null;

  const matches = useMemo(() => {
    if (activeField === null) {
      return [];
    }

    const term = search.trim().toLowerCase();

    return term === ''
      ? activeField.options
      : activeField.options.filter((option) =>
          option.label.toLowerCase().includes(term),
        );
  }, [activeField, search]);

  const close = () => {
    setIsOpen(false);
    setActiveFieldKey(null);
    setSearch('');
    setHoveredKey(null);
  };

  const openField = (key: string | null) => {
    setActiveFieldKey(key);
    setSearch('');
    setHoveredKey(null);
  };

  const rowStyle = (key: string) =>
    ({
      alignItems: 'center',
      background:
        hoveredKey === key ? TASK_TOKENS.backgroundHover : 'transparent',
      border: 'none',
      borderRadius: TASK_TOKENS.radiusSmall,
      color: TASK_TOKENS.textPrimary,
      cursor: 'pointer',
      display: 'flex',
      fontFamily: TASK_TOKENS.fontFamily,
      fontSize: 13,
      gap: 8,
      minHeight: 30,
      padding: '0 8px',
      textAlign: 'left',
      width: '100%',
    }) as const;

  return (
    <span style={{ display: 'inline-flex', position: 'relative' }}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={t('Filter')}
        title={t('Filter')}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        style={{
          alignItems: 'center',
          background:
            isOpen || isTriggerHovered
              ? TASK_TOKENS.backgroundHover
              : 'transparent',
          border: 'none',
          borderRadius: TASK_TOKENS.radiusSmall,
          color: TASK_TOKENS.textSecondary,
          cursor: 'pointer',
          display: 'inline-flex',
          flexShrink: 0,
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 500,
          gap: 6,
          height: TRIGGER_HEIGHT,
          padding: isCompact ? '0 6px' : '0 8px',
        }}
      >
        <IconFilter size={14} />
        {!isCompact && t('Filter')}
      </button>

      {isOpen && (
        <twenty-overlay offsetY={TRIGGER_HEIGHT + 4} onClose={close}>
          <div
            role="menu"
            aria-label={t('Filter')}
            style={{
              background: TASK_TOKENS.background,
              border: `1px solid ${TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radius,
              boxShadow: TASK_TOKENS.shadowStrong,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              width: MENU_WIDTH,
            }}
          >
            {activeField === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', padding: 4 }}>
                {fields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    role="menuitem"
                    onClick={() => openField(field.key)}
                    onMouseEnter={() => setHoveredKey(field.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={rowStyle(field.key)}
                  >
                    <span
                      style={{
                        color: TASK_TOKENS.textTertiary,
                        display: 'inline-flex',
                      }}
                    >
                      {field.icon}
                    </span>
                    <span style={{ flex: 1 }}>{field.label}</span>
                    {field.selectedValues.length > 0 && (
                      <span
                        style={{
                          color: TASK_TOKENS.accent,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {field.selectedValues.length}
                      </span>
                    )}
                    <IconChevronRight size={14} color={TASK_TOKENS.textTertiary} />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div
                  style={{
                    alignItems: 'center',
                    borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                    display: 'flex',
                    gap: 6,
                    height: 36,
                    padding: '0 6px',
                  }}
                >
                  <button
                    type="button"
                    aria-label={t('Back')}
                    title={t('Back')}
                    onClick={() => openField(null)}
                    style={{
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: TASK_TOKENS.textTertiary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      padding: 2,
                    }}
                  >
                    <IconChevronLeft size={14} />
                  </button>
                  {activeField.options.length > 6 ? (
                    <>
                      <IconSearch size={14} color={TASK_TOKENS.textTertiary} />
                      <input
                        aria-label={activeField.label}
                        value={search}
                        placeholder={activeField.label}
                        onChange={(event) => setSearch(event.target.value)}
                        style={TASK_BARE_FIELD_STYLE}
                      />
                    </>
                  ) : (
                    <span
                      style={{
                        color: TASK_TOKENS.textSecondary,
                        fontFamily: TASK_TOKENS.fontFamily,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {activeField.label}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 300,
                    overflowY: 'auto',
                    ...TASK_THIN_SCROLLBAR_STYLE,
                    padding: 4,
                  }}
                >
                  {matches.length === 0 ? (
                    <span
                      style={{
                        color: TASK_TOKENS.textTertiary,
                        fontFamily: TASK_TOKENS.fontFamily,
                        fontSize: 12,
                        padding: 8,
                      }}
                    >
                      {t('No result')}
                    </span>
                  ) : (
                    matches.map((option) => {
                      const isSelected = activeField.selectedValues.includes(
                        option.value,
                      );

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={isSelected}
                          onClick={() => {
                            activeField.onToggle(option.value);

                            if (!activeField.isMulti) {
                              close();
                            }
                          }}
                          onMouseEnter={() => setHoveredKey(option.value)}
                          onMouseLeave={() => setHoveredKey(null)}
                          style={rowStyle(option.value)}
                        >
                          {option.icon !== undefined && (
                            <span style={{ display: 'inline-flex' }}>
                              {option.icon}
                            </span>
                          )}
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {option.label}
                          </span>
                          {isSelected && (
                            <IconCheck size={14} color={TASK_TOKENS.accent} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </twenty-overlay>
      )}
    </span>
  );
};
