import { useEffect, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconSearch, IconUserPlus } from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import {
  CLIENT_SAVE_ROUTE_PATH,
  MERCHANT_SEARCH_ROUTE_PATH,
} from '../../constants/route-paths';
import { type BcContextResult } from '../../types/bc-context';
import { type MerchantDomainOption } from '../../types/dashboard';
import { postAppRoute, readErrorText } from '../utils/post-app-route.util';
import { BcPanelSection, BcSidePanel } from './bc-side-panel';
import { BcSelect } from './bc-select';
import { AppBadge } from './bc-tags';
import { BcField, BcTextArea, BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';
import { buildPicOptions, UNASSIGNED_VALUE } from './client-pic';

const NO_TEAM_VALUE = 'NO_TEAM';

const SEARCH_DELAY_MS = 300;

const ShopOption = ({
  shop,
  isSelected,
  onSelect,
}: {
  shop: MerchantDomainOption;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const isLinked = shop.vipClientId !== null;

  return (
    <button
      type="button"
      disabled={isLinked}
      onClick={onSelect}
      style={{
        alignItems: 'center',
        background: isSelected ? BC_TOKENS.backgroundSelected : 'transparent',
        border: `1px solid ${isSelected ? BC_TOKENS.accent : BC_TOKENS.borderLight}`,
        borderRadius: BC_TOKENS.radiusSmall,
        color: BC_TOKENS.textPrimary,
        cursor: isLinked ? 'not-allowed' : 'pointer',
        display: 'flex',
        fontFamily: BC_TOKENS.fontFamily,
        fontSize: BC_TOKENS.fontSizeMd,
        gap: spacing(2),
        opacity: isLinked ? 0.6 : 1,
        padding: spacing(2),
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontWeight: BC_TOKENS.fontWeightMedium, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {shop.storeName ?? shop.shopDomain}
        </span>
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {shop.shopDomain}
        </span>
      </span>
      <span style={{ display: 'flex', gap: spacing(1) }}>
        {shop.appNames.map((appName) => (
          <AppBadge key={appName} appName={appName} />
        ))}
      </span>
      {isLinked && (
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {t('Already VIP')}
        </span>
      )}
    </button>
  );
};

export const DashboardAddClientPanel = ({
  context,
  width,
  onClose,
  onCreated,
}: {
  context: BcContextResult;
  width: number | string;
  onClose: () => void;
  onCreated: (vipClientId: string) => void;
}) => {
  const [query, setQuery] = useState('');
  const [shops, setShops] = useState<MerchantDomainOption[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MerchantDomainOption | null>(null);
  const [name, setName] = useState('');
  const [picId, setPicId] = useState(
    context.scope.role === 'MANAGER' || context.scope.role === 'ADMIN'
      ? UNASSIGNED_VALUE
      : (context.scope.workspaceMemberId ?? UNASSIGNED_VALUE),
  );
  const [notes, setNotes] = useState('');
  const teamOptions = context.teams
    .filter(
      (team) =>
        context.scope.role === 'ADMIN' || context.scope.managedTeamIds.includes(team.id),
    )
    .map((team) => ({ value: team.id, label: team.name }));
  const [teamId, setTeamId] = useState(teamOptions[0]?.value ?? NO_TEAM_VALUE);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced so typing a domain sends one search, not one per key.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setShops([]);

      return;
    }

    let isCurrent = true;
    const timer = setTimeout(() => {
      postAppRoute<{ success: true; shops: MerchantDomainOption[] }>(MERCHANT_SEARCH_ROUTE_PATH, {
        query: trimmed,
      })
        .then((result) => {
          if (isCurrent) {
            setShops(result.shops);
            setSearchError(null);
          }
        })
        .catch((error) => {
          if (isCurrent) {
            setSearchError(readErrorText(error));
          }
        });
    }, SEARCH_DELAY_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query]);

  const save = async () => {
    if (selected === null) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await postAppRoute<{ success: true; vipClient: { id: string } }>(
        CLIENT_SAVE_ROUTE_PATH,
        {
          vipClientId: null,
          shopDomain: selected.shopDomain,
          name: name.trim() || selected.storeName || selected.shopDomain,
          picId: picId === UNASSIGNED_VALUE ? null : picId,
          teamId: teamId === NO_TEAM_VALUE ? null : teamId,
          notes: notes.trim() || null,
        },
      );

      void enqueueSnackbar({ message: t('VIP client added'), variant: 'success' });
      onCreated(result.vipClient.id);
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BcSidePanel
      title={t('Add VIP client')}
      icon={<IconUserPlus size={16} />}
      width={width}
      ariaLabel={t('Add VIP client')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" color="neutral" size="sm" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            variant="solid"
            color="accent"
            size="sm"
            loading={isSaving}
            disabled={isSaving || selected === null}
            onClick={() => void save()}
          >
            {t('Add client')}
          </Button>
        </>
      }
    >
      <BcPanelSection title={t('Shop')}>
        <BcTextInput
          value={query}
          onChange={setQuery}
          type="search"
          ariaLabel={t('Search shops')}
          placeholder={t('Shopify domain or store name')}
          startElement={
            <span style={{ color: BC_TOKENS.textTertiary, display: 'inline-flex', paddingLeft: spacing(2) }}>
              <IconSearch size={14} />
            </span>
          }
        />
        {searchError !== null && (
          <Banner color="danger" variant="secondary">
            {searchError}
          </Banner>
        )}
        {query.trim().length >= 2 && shops.length === 0 && searchError === null && (
          <span style={{ color: BC_TOKENS.textTertiary }}>
            {t('No shop with an app install matches. Shops appear here once one of our apps is installed.')}
          </span>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
          {shops.map((shop) => (
            <ShopOption
              key={shop.shopDomain}
              shop={shop}
              isSelected={selected?.shopDomain === shop.shopDomain}
              onSelect={() => {
                setSelected(shop);
                setName(shop.storeName ?? '');
              }}
            />
          ))}
        </div>
      </BcPanelSection>
      {selected !== null && (
        <BcPanelSection title={t('Client')}>
          <BcField label={t('Display name')}>
            <BcTextInput
              value={name}
              onChange={setName}
              ariaLabel={t('Display name')}
              placeholder={selected.storeName ?? selected.shopDomain}
            />
          </BcField>
          <BcField label={t('PIC')}>
            <BcSelect
              ariaLabel={t('PIC')}
              value={picId}
              onChange={setPicId}
              options={buildPicOptions(context.members, true)}
              menuWidth={280}
            />
          </BcField>
          {teamOptions.length > 1 || (context.scope.role === 'ADMIN' && teamOptions.length > 0) ? (
            <BcField
              label={t('Team')}
              hint={t('The PIC decides the team. Without a PIC, only this team and admins see the client.')}
            >
              <BcSelect
                ariaLabel={t('Team')}
                value={teamId}
                onChange={setTeamId}
                options={[
                  ...(context.scope.role === 'ADMIN'
                    ? [{ value: NO_TEAM_VALUE, label: t('No team') }]
                    : []),
                  ...teamOptions,
                ]}
                menuWidth={280}
              />
            </BcField>
          ) : null}
          <BcField label={t('Notes')}>
            <BcTextArea value={notes} onChange={setNotes} ariaLabel={t('Notes')} maxLength={2500} />
          </BcField>
        </BcPanelSection>
      )}
    </BcSidePanel>
  );
};
