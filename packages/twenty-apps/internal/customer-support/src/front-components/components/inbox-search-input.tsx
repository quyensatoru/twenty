import { useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconSearch, IconX } from 'twenty-ui/icon';

import { INBOX_TOKENS } from './inbox-tokens';

type InboxSearchInputProps = {
  onSearch: (value: string) => void;
};

// Left uncontrolled: the sandbox mirrors a controlled value to the host on a
// separate round trip, and fast typing would lose characters. Clearing
// remounts the field through `resetKey`.
export const InboxSearchInput = ({ onSearch }: InboxSearchInputProps) => {
  const [resetKey, setResetKey] = useState(0);
  const [hasValue, setHasValue] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingSearch = () => {
    if (pendingTimer.current !== null) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
  };

  // Waits for a pause in typing so every keystroke is not a request.
  const scheduleSearch = (value: string) => {
    cancelPendingSearch();
    pendingTimer.current = setTimeout(() => {
      pendingTimer.current = null;
      onSearch(value.trim());
    }, 300);
  };

  return (
    <div
      style={{
        alignItems: 'center',
        background: INBOX_TOKENS.backgroundSecondary,
        border: `1px solid ${isFocused ? INBOX_TOKENS.accent : INBOX_TOKENS.border}`,
        borderRadius: 10,
        boxShadow: isFocused ? `0 0 0 3px ${INBOX_TOKENS.accentSoft}` : 'none',
        display: 'flex',
        gap: 8,
        height: 36,
        padding: '0 10px',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
      }}
    >
      <IconSearch size={16} color={INBOX_TOKENS.textTertiary} />
      <input
        key={resetKey}
        aria-label={t('Search conversations')}
        placeholder={t('Search name, email, shop…')}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => {
          setHasValue(event.target.value.length > 0);
          scheduleSearch(event.target.value);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: INBOX_TOKENS.textPrimary,
          flex: 1,
          fontFamily: 'inherit',
          fontSize: 13,
          minWidth: 0,
          outline: 'none',
        }}
      />
      {hasValue && (
        <button
          type="button"
          aria-label={t('Clear search')}
          onClick={() => {
            setResetKey((key) => key + 1);
            setHasValue(false);
            cancelPendingSearch();
            onSearch('');
          }}
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            color: INBOX_TOKENS.textTertiary,
            cursor: 'pointer',
            display: 'inline-flex',
            padding: 0,
          }}
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
};
