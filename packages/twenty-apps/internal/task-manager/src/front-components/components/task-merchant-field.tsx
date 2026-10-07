import { useEffect, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPencil, IconSearch } from 'twenty-ui/icon';

import {
  type MerchantOptionRow,
  useMerchantOptions,
} from '../hooks/use-merchant-options';
import { TaskCheckbox } from './task-checkbox';
import { TASK_BARE_FIELD_STYLE } from './task-control-styles';
import { TaskIconButton } from './task-icon-button';
import { TaskRecordChip } from './task-record-chip';
import { TASK_THIN_SCROLLBAR_STYLE, TASK_TOKENS } from './task-tokens';

type TaskMerchantFieldProps = {
  projectId: string | null;
  // What the issue links today, read off the record rather than off the
  // candidate list — a merchant already linked stays visible even when the
  // search no longer returns it.
  linkedMerchants: MerchantOptionRow[];
  onChange: (merchantIds: string[]) => void;
  // Owned by the panel: two fields each holding their own open flag means two
  // dropdowns drawn over each other, with neither reachable.
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOpenMerchant: (merchantId: string) => void;
  isDisabled?: boolean;
};

const ROW_HEIGHT = 24;
const OPTION_HEIGHT = 32;
// Measured on the host's own relation dropdown: a 36px search line over 32px
// option rows, in a 202px card with an 8px radius.
const SEARCH_HEIGHT = 36;
const CARD_WIDTH = 202;
const OPTIONS_MAX_HEIGHT = 180;
// Measured on the host's own relation dropdown: it opens 5px up and left of the
// value it belongs to, so the first option lands over the chip just clicked.
const OVERLAY_INSET = 5;
// Long enough that a word typed at speed is one request rather than one per
// letter: every keystroke used to reach the server.
const SEARCH_DEBOUNCE_MS = 250;

// The merchant links, drawn as the same field as its single-valued neighbours:
// chips on the row, a pencil on hover, a card with a search box when it is
// open. The one difference is that picking does not close it — a multi-valued
// field is usually being given more than one thing.
//
// Unlinking happens by unticking in the list rather than through a cross on
// each chip: the row has to stay one line tall whatever it holds, and per-chip
// controls are the first thing to break that.
export const TaskMerchantField = ({
  projectId,
  linkedMerchants,
  onChange,
  isOpen,
  onOpenChange,
  onOpenMerchant,
  isDisabled = false,
}: TaskMerchantFieldProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // What the reader has ticked, shown before the server has confirmed it. The
  // save re-runs the issue-detail route — ten scoped queries — and waiting for
  // that round trip before the chip moves is what made ticking feel broken.
  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null);

  useEffect(() => {
    const handle = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(handle);
  }, [search]);

  const candidates = useMerchantOptions({
    projectId,
    search: debouncedSearch,
  });

  const knownById = new Map<string, MerchantOptionRow>([
    ...linkedMerchants.map((merchant) => [merchant.id, merchant] as const),
    ...candidates.map((merchant) => [merchant.id, merchant] as const),
  ]);

  const recordIds = linkedMerchants.map((merchant) => merchant.id);
  // The record wins again the moment it agrees with what was ticked: anything
  // else would keep showing a guess after the answer arrived.
  const hasLanded =
    optimisticIds !== null &&
    optimisticIds.length === recordIds.length &&
    optimisticIds.every((id) => recordIds.includes(id));

  if (hasLanded) {
    setOptimisticIds(null);
  }

  const linkedIds = optimisticIds ?? recordIds;
  const linkedById = new Map(
    linkedIds.flatMap((id) => {
      const merchant = knownById.get(id);

      return merchant === undefined ? [] : [[id, merchant] as const];
    }),
  );
  const shownMerchants = [...linkedById.values()];

  const close = () => {
    onOpenChange(false);
    setSearch('');
  };

  const open = () => {
    setSearch('');
    onOpenChange(true);
  };

  const toggle = (merchantId: string) => {
    const nextIds = linkedIds.includes(merchantId)
      ? linkedIds.filter((id) => id !== merchantId)
      : [...linkedIds, merchantId];

    setOptimisticIds(nextIds);
    onChange(nextIds);
  };

  // What the issue links comes first, so unticking one stays possible even when
  // the search no longer returns it; the rest follows in the route's order.
  const options = [
    ...shownMerchants,
    ...candidates.filter((merchant) => !linkedById.has(merchant.id)),
  ].filter((merchant) =>
    (merchant.name ?? merchant.id)
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <div style={{ minWidth: 0, width: '100%' }}>
      {/* The overlay anchors to this row, so the card opens on the chips and a
          click anywhere else on the page closes it — but a click on a chip or
          on the pencil does not, since those own the toggle themselves. */}
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
        <button
          type="button"
          aria-label={t('Merchants')}
          aria-expanded={isOpen}
          disabled={isDisabled}
          onClick={() => (isOpen ? close() : open())}
          style={{
            alignItems: 'center',
            background:
              isHovered && !isDisabled
                ? TASK_TOKENS.backgroundHover
                : 'transparent',
            border: 'none',
            borderRadius: TASK_TOKENS.radius,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            // One line, never wrapping. This is the only row whose height would
            // otherwise follow its data, and a panel taller than its widget is
            // answered with a scrollbar there is no way to turn off.
            flexWrap: 'nowrap',
            gap: 6,
            maxWidth: '100%',
            minHeight: ROW_HEIGHT,
            minWidth: 0,
            opacity: isDisabled ? 0.5 : 1,
            overflow: 'hidden',
            padding: '0 4px',
            textAlign: 'left',
          }}
        >
          {shownMerchants.length === 0 ? (
            <span
              style={{
                color: TASK_TOKENS.textLight,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
              }}
            >
              {t('Merchants')}
            </span>
          ) : (
            shownMerchants.map((merchant) => (
              <span
                key={merchant.id}
                role="link"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenMerchant(merchant.id);
                }}
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                <TaskRecordChip
                  name={merchant.name ?? merchant.id}
                  shape="square"
                />
              </span>
            ))
          )}
        </button>

        {isHovered && !isDisabled && shownMerchants.length > 0 && (
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
            offsetX={-OVERLAY_INSET}
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
                  aria-label={t('Search merchants')}
                  value={search}
                  placeholder={t('Search')}
                  onChange={(event) => setSearch(event.target.value)}
                  style={TASK_BARE_FIELD_STYLE}
                />
              </div>

              <div
                role="listbox"
                aria-multiselectable="true"
                style={{
                  maxHeight: OPTIONS_MAX_HEIGHT,
                  overflowY: 'auto',
                  ...TASK_THIN_SCROLLBAR_STYLE,
                  padding: 4,
                }}
              >
                {options.length === 0 ? (
                  <span
                    style={{
                      color: TASK_TOKENS.textTertiary,
                      display: 'block',
                      fontFamily: TASK_TOKENS.fontFamily,
                      fontSize: 12,
                      padding: 6,
                    }}
                  >
                    {t('No result')}
                  </span>
                ) : (
                  options.map((merchant) => {
                    const isLinked = linkedById.has(merchant.id);

                    return (
                      <button
                        key={merchant.id}
                        type="button"
                        role="option"
                        aria-selected={isLinked}
                        onMouseEnter={() => setHoveredId(merchant.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => toggle(merchant.id)}
                        style={{
                          alignItems: 'center',
                          background:
                            hoveredId === merchant.id
                              ? TASK_TOKENS.backgroundHover
                              : 'transparent',
                          border: 'none',
                          borderRadius: TASK_TOKENS.radiusSmall,
                          cursor: 'pointer',
                          display: 'flex',
                          gap: 8,
                          justifyContent: 'space-between',
                          minHeight: OPTION_HEIGHT,
                          padding: '0 6px',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <span
                          style={{
                            alignItems: 'center',
                            display: 'inline-flex',
                            gap: 8,
                            minWidth: 0,
                          }}
                        >
                          <TaskCheckbox isChecked={isLinked} />
                          <TaskRecordChip
                            name={merchant.name ?? merchant.id}
                            shape="square"
                          />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </twenty-overlay>
        )}
      </div>
    </div>
  );
};
