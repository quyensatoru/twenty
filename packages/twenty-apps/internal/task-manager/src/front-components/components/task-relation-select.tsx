import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconCheck, IconForbid, IconPencil, IconSearch } from 'twenty-ui/icon';

import { TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TaskIconButton } from './task-icon-button';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

export type TaskRelationOption = {
  value: string;
  // What the search box matches on, and what assistive tech reads; the chip is
  // what the eye gets.
  label: string;
  chip: ReactNode;
  // What the row shows once this option is the value. Defaults to `chip`; set
  // it where the list needs to say more than the row does — two people with one
  // name are told apart by their address in the list, but the row shows the
  // record, exactly as the host's does.
  valueChip?: ReactNode;
};

type TaskRelationSelectProps = {
  value: string | null;
  options: readonly TaskRelationOption[];
  onChange: (value: string | null) => void;
  ariaLabel: string;
  // What an unset field shows on the row, and what clearing it is called in the
  // list. Twenty writes the field's own name on the row in light grey rather
  // than leaving it blank.
  placeholder: string;
  emptyOptionLabel: string;
  // Owned by the panel, not by the field: two fields each holding their own
  // open flag means two dropdowns drawn over each other, with neither
  // reachable.
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // Opens the record the chip stands for. Twenty's own relation chip is a link
  // first and an editor second: the pencil is what changes the value.
  onOpenRecord?: () => void;
  isDisabled?: boolean;
  // Shifts the card left of its anchor. The host only clamps overlays to the
  // viewport, so a left-aligned 202px card in the modal's right-hand Details
  // panel spills past the modal border onto the backdrop. A negative offset
  // right-aligns it back inside; the default keeps the option list over the
  // chip just clicked.
  overlayOffsetX?: number;
};

// What RecordInlineCellContainer gives a row: a 24px label line and a value
// that is only as tall as its content.
const ROW_HEIGHT = 24;
const OPTION_HEIGHT = 32;
// Measured on the host's own relation dropdown: a 36px search line over 32px
// option rows, in a 202px card with an 8px radius.
const SEARCH_HEIGHT = 36;
const CARD_WIDTH = 202;
// The host's own dropdown measures 222 overall; with the 36px search line this
// is the same card.
const OPTIONS_MAX_HEIGHT = 180;
// Measured on the host's own relation dropdown: it opens 5px up and left of the
// value it belongs to, so the first option lands over the chip just clicked.
const OVERLAY_INSET = 5;
// Clearing a relation is an option in the list like any other, so it needs a
// value of its own; every id here is a uuid, so the empty string is free.
const NO_VALUE = '';

// A relation field as Twenty draws one: no box on the row, just the record's
// chip over a tint on hover, and a card with a search box and a "no value"
// entry when it is open.
//
// The card is handed to the host rather than drawn here. A widget clips what it
// contains and paints inside its own stacking context, so a card written inline
// is cut off and covered by the widget beside it; and a click that lands
// outside the component never reaches the guest, so it could not even learn it
// should close.
export const TaskRelationSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  emptyOptionLabel,
  isOpen,
  onOpenChange,
  onOpenRecord,
  isDisabled = false,
  overlayOffsetX = -OVERLAY_INSET,
}: TaskRelationSelectProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const selected = options.find((option) => option.value === value) ?? null;

  const matches = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const close = () => {
    onOpenChange(false);
    setSearch('');
  };

  const open = () => {
    setSearch('');
    onOpenChange(true);
  };

  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      {/* The overlay anchors to this row, so the card opens on the value and
          a click anywhere else on the page closes it — but a click on the chip
          or the pencil does not, since those own the toggle themselves. */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 4,
          minWidth: 0,
          width: '100%',
        }}
      >
        {/* Sized to its content, never to the row: the tint behind a chip is
            the chip's, and a value box stretched across the widget is the one
            thing that stops this looking like a Twenty field. */}
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          disabled={isDisabled}
          onClick={() => {
            // A chip stands for a record, so it goes to that record. Changing
            // the value is the pencil's job — and an empty field has no record
            // to go to, so there the whole row opens the list.
            if (selected !== null && onOpenRecord !== undefined) {
              onOpenRecord();

              return;
            }

            if (isOpen) {
              close();
            } else {
              open();
            }
          }}
          style={{
            alignItems: 'center',
            background:
              isHovered && !isDisabled
                ? TASK_TOKENS.backgroundHover
                : 'transparent',
            border: 'none',
            borderRadius: TASK_TOKENS.radius,
            color: TASK_TOKENS.textPrimary,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 13,
            maxWidth: '100%',
            minHeight: ROW_HEIGHT,
            minWidth: 0,
            opacity: isDisabled ? 0.5 : 1,
            overflow: 'hidden',
            padding: '0 4px',
            textAlign: 'left',
          }}
        >
          {selected === null ? (
            <span style={{ color: TASK_TOKENS.textLight }}>{placeholder}</span>
          ) : (
            (selected.valueChip ?? selected.chip)
          )}
        </button>

        {/* On hover, beside the value, and only when there is a value to edit
            — the same three conditions RecordInlineCellDisplayMode puts on it. */}
        {isHovered && !isDisabled && selected !== null && (
          <TaskIconButton
            label={t('Edit')}
            isElevated
            onClick={() => (isOpen ? close() : open())}
          >
            <IconPencil size={14} />
          </TaskIconButton>
        )}

        {isOpen && (
          <twenty-overlay
            offsetX={overlayOffsetX}
            offsetY={-OVERLAY_INSET}
            onClose={close}
          >
            <div
              style={{
                background: TASK_TOKENS.background,
                border: `1px solid ${TASK_TOKENS.borderLight}`,
                // sm, not md: md is 16px here and belongs to the value chip;
                // the host's own dropdown card measures 8.
                borderRadius: TASK_TOKENS.radiusSmall,
                boxShadow: TASK_TOKENS.shadowStrong,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                width: CARD_WIDTH,
              }}
            >
              {/* The host's own relation dropdown opens on a search box however
                  short the list is, so this one does too. */}
              <div
                style={{
                  alignItems: 'center',
                  borderBottom: `1px solid ${TASK_TOKENS.borderLight}`,
                  display: 'flex',
                  gap: 6,
                  height: SEARCH_HEIGHT,
                  padding: '0 8px',
                }}
              >
                <IconSearch size={14} color={TASK_TOKENS.textTertiary} />
                <input
                  aria-label={t('Search')}
                  value={search}
                  placeholder={t('Search')}
                  onChange={(event) => setSearch(event.target.value)}
                  style={TASK_BARE_FIELD_STYLE}
                />
              </div>

              <div
                role="listbox"
                style={{
                  maxHeight: OPTIONS_MAX_HEIGHT,
                  overflowY: 'auto',
                  ...TASK_THIN_SCROLLBAR_STYLE,
                  padding: 4,
                }}
              >
                {matches.length === 0 ? (
                  <span
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      display: 'block',
                      fontSize: 12,
                      padding: 6,
                    }}
                  >
                    {t('No result')}
                  </span>
                ) : (
                  matches.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      onMouseEnter={() => setHoveredValue(option.value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      onClick={() => {
                        onChange(
                          option.value === NO_VALUE ? null : option.value,
                        );
                        close();
                      }}
                      style={{
                        alignItems: 'center',
                        background:
                          hoveredValue === option.value
                            ? TASK_TOKENS.backgroundHover
                            : 'transparent',
                        border: 'none',
                        borderRadius: TASK_TOKENS.radiusSmall,
                        color: TASK_TOKENS.textPrimary,
                        cursor: 'pointer',
                        display: 'flex',
                        fontFamily: TASK_TOKENS.fontFamily,
                        fontSize: 13,
                        gap: 8,
                        justifyContent: 'space-between',
                        minHeight: OPTION_HEIGHT,
                        padding: '0 6px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {/* Clearing the field reads as an entry of its own, the
                          way the host writes "No Project" behind a crossed
                          circle, rather than as grey text with nothing beside
                          it. */}
                      <span
                        style={{
                          alignItems: 'center',
                          display: 'inline-flex',
                          gap: 6,
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {option.value === NO_VALUE ? (
                          <>
                            <IconForbid
                              size={16}
                              color={TASK_TOKENS.textTertiary}
                            />
                            {emptyOptionLabel}
                          </>
                        ) : (
                          option.chip
                        )}
                      </span>
                      {option.value === value && (
                        <IconCheck size={14} color={TASK_TOKENS.accent} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </twenty-overlay>
        )}
      </div>
    </div>
  );
};
