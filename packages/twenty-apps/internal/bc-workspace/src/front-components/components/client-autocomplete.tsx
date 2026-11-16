import '../../types/front-component-host-elements';

import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconSearch, IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { type TaskClientSummary } from '../../types/tasks';
import { useClientSearch } from '../hooks/use-client-search';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing, THIN_SCROLLBAR_STYLE } from './bc-theme';

type ClientAutocompleteProps = {
  value: TaskClientSummary | null;
  onChange: (client: TaskClientSummary | null) => void;
  allowNone?: boolean;
};

const INPUT_HEIGHT = 32;

const ResultButton = ({
  title,
  subtitle,
  onSelect,
}: {
  title: string;
  subtitle?: string | null;
  onSelect: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      role="option"
      aria-selected={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      style={{
        background: isHovered ? BC_TOKENS.backgroundHover : 'transparent',
        border: 'none',
        borderRadius: BC_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        color: BC_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: BC_TOKENS.fontFamily,
        fontSize: BC_TOKENS.fontSizeMd,
        gap: 2,
        padding: `${spacing(1.5)} ${spacing(2)}`,
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span>{title}</span>
      {subtitle !== undefined && subtitle !== null && (
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {subtitle}
        </span>
      )}
    </button>
  );
};

// Searches the server as the BC types (name or Shopify domain, only clients
// they may see) and stores the stable client id, never the typed text.
export const ClientAutocomplete = ({
  value,
  onChange,
  allowNone = true,
}: ClientAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { clients, hasMore, isSearching, error, isQueryTooShort } = useClientSearch(query);

  if (value !== null) {
    return (
      <div
        style={{
          alignItems: 'center',
          border: `1px solid ${BC_TOKENS.border}`,
          borderRadius: BC_TOKENS.radiusSmall,
          boxSizing: 'border-box',
          display: 'flex',
          gap: spacing(2),
          justifyContent: 'space-between',
          minHeight: INPUT_HEIGHT,
          padding: `${spacing(1)} ${spacing(1)} ${spacing(1)} ${spacing(2)}`,
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>
            {value.name ?? value.shopDomain ?? ''}
          </span>
          {value.shopDomain !== null && (
            <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
              {value.shopDomain}
            </span>
          )}
        </span>
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label={t('Clear client')}
          startIcon={<IconX size={14} />}
          onClick={() => {
            onChange(null);
            setQuery('');
          }}
        />
      </div>
    );
  }

  const showResults = isOpen && (allowNone || !isQueryTooShort);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <BcTextInput
        value={query}
        onChange={(nextQuery) => {
          setQuery(nextQuery);
          setIsOpen(true);
        }}
        type="search"
        ariaLabel={t('Search clients')}
        placeholder={t('Company name or Shopify domain…')}
        startElement={
          <span
            style={{
              color: BC_TOKENS.textTertiary,
              display: 'inline-flex',
              paddingLeft: spacing(2),
            }}
          >
            <IconSearch size={14} />
          </span>
        }
      />
      {!isOpen && allowNone && (
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {t('No client: this is a personal task.')}
        </span>
      )}
      {showResults && (
        <twenty-overlay offsetY={INPUT_HEIGHT + 4} onClose={() => setIsOpen(false)}>
          <div
            role="listbox"
            aria-label={t('Matching clients')}
            style={{
              background: BC_TOKENS.background,
              border: `1px solid ${BC_TOKENS.border}`,
              borderRadius: BC_TOKENS.radius,
              boxShadow: BC_TOKENS.shadow,
              boxSizing: 'border-box',
              maxHeight: 300,
              overflowY: 'auto',
              padding: spacing(1),
              width: 360,
              ...THIN_SCROLLBAR_STYLE,
            }}
          >
            {allowNone && (
              <ResultButton
                title={t('No client (personal task)')}
                onSelect={() => {
                  onChange(null);
                  setQuery('');
                  setIsOpen(false);
                }}
              />
            )}
            {isQueryTooShort ? (
              <Hint>{t('Type at least 2 characters of a name or domain.')}</Hint>
            ) : isSearching && clients.length === 0 ? (
              <Hint>{t('Searching…')}</Hint>
            ) : error !== null ? (
              <Hint isError>{error}</Hint>
            ) : clients.length === 0 ? (
              <Hint>{t('No client you manage matches.')}</Hint>
            ) : (
              <>
              {clients.map((client) => (
                <ResultButton
                  key={client.id}
                  title={client.name ?? client.shopDomain ?? ''}
                  subtitle={[client.shopDomain, client.picName]
                    .filter((part) => part !== null && part.length > 0)
                    .join(' · ')}
                  onSelect={() => {
                    onChange({
                      id: client.id,
                      name: client.name,
                      shopDomain: client.shopDomain,
                    });
                    setQuery('');
                    setIsOpen(false);
                  }}
                />
              ))}
              {hasMore && <Hint>{t('More clients match. Keep typing to narrow down.')}</Hint>}
              </>
            )}
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

const Hint = ({
  children,
  isError = false,
}: {
  children: string;
  isError?: boolean;
}) => (
  <div
    style={{
      color: isError ? BC_TOKENS.danger : BC_TOKENS.textTertiary,
      fontSize: BC_TOKENS.fontSizeSm,
      padding: `${spacing(1.5)} ${spacing(2)}`,
    }}
  >
    {children}
  </div>
);
