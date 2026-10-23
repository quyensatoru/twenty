import { type ReactNode, useMemo, useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import { IconPlug, IconPlus, IconSearch } from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';

import {
  DISCOUNT_CONSOLE_DELETE_ROUTE_PATH,
  DISCOUNT_CONSOLE_RESEND_ROUTE_PATH,
  DISCOUNT_CONSOLE_SAVE_ROUTE_PATH,
} from '../../constants/discount';
import {
  type AppErrorItem,
  type DiscountListItem,
  type DiscountSaveResult,
} from '../../types/discount';
import { type DiscountDraft } from '../../utils/discount-rules.util';
import { useDiscountDetail, useDiscounts } from '../hooks/use-discounts';
import { useIsMobile } from '../hooks/use-is-mobile';
import {
  addDays,
  type DiscountValidity,
  filterDiscounts,
  needsAttention,
  readDiscountShop,
  toDayString,
} from '../utils/discount-display.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { DiscountConnectionsPanel } from './discount-connections-panel';
import { DiscountDetailPanel } from './discount-detail-panel';
import { type DiscountActionHandlers } from './discount-row-actions';
import { DiscountEditor, type DiscountEditorSeed } from './discount-editor';
import { DiscountTableSkeleton } from './discount-skeleton';
import { DiscountTable } from './discount-table';
import { TextInput } from './discount-fields';
import { DiscountThemeRoot } from './discount-theme-root';
import {
  DISCOUNT_TOKENS,
  readAppColor,
  readColorScale,
  spacing,
} from './discount-theme';

const buildEmptyDraft = (
  appId: string | null,
  appName: string | null,
): DiscountDraft => {
  const today = toDayString(new Date());

  return {
    appId,
    appName,
    scope: 'SINGLE',
    merchantId: null,
    merchantDomain: null,
    assignedDomains: [],
    discountType: 'PERCENTAGE',
    discountValue: null,
    limitInIntervals: 1,
    limitUsage: 1,
    startDate: today,
    endDate: addDays(today, 7),
    discountCode: '',
    reason: '',
    status: true,
  };
};

// Older discounts have no scope: a known merchant means one merchant, a shop
// read from the domains or the name becomes a one-line shop list (there is
// no merchant record to pick), and nothing at all means every shop, which is
// how the list already shows them.
const readDraftScope = (discount: DiscountListItem): DiscountDraft['scope'] => {
  if (discount.scope !== null) {
    return discount.scope;
  }

  if (discount.merchantId !== null) {
    return 'SINGLE';
  }

  return readDiscountShop(discount) === null ? 'ALL' : 'MULTI';
};

const toDraft = (discount: DiscountListItem): DiscountDraft => ({
  appId: discount.appId,
  appName: discount.appName,
  scope: readDraftScope(discount),
  merchantId: discount.merchantId,
  merchantDomain: discount.merchantName ?? readDiscountShop(discount),
  assignedDomains:
    discount.assignedDomains.length > 0 || discount.scope !== null
      ? discount.assignedDomains
      : [readDiscountShop(discount)].filter(
          (domain): domain is string => domain !== null,
        ),
  discountType: discount.discountType ?? 'PERCENTAGE',
  discountValue: discount.discountValue,
  limitInIntervals: discount.limitInIntervals,
  limitUsage: discount.limitUsage,
  startDate: discount.startDate,
  endDate: discount.endDate,
  discountCode: discount.discountCode,
  reason: discount.reason ?? '',
  status: discount.status,
});

// Twenty's view bar look: small ghost buttons that turn soft when active.
const FilterButton = ({
  isOn,
  onClick,
  children,
  color = 'accent',
}: {
  isOn: boolean;
  onClick: () => void;
  children: ReactNode;
  color?: 'accent' | 'danger';
}) => (
  <Button
    variant={isOn ? 'soft' : 'ghost'}
    color={isOn ? color : 'neutral'}
    size="sm"
    onClick={onClick}
  >
    {children}
  </Button>
);

const Count = ({ value }: { value: number | null }) =>
  value === null ? null : (
  <span style={{ color: DISCOUNT_TOKENS.textTertiary, fontVariantNumeric: 'tabular-nums', marginLeft: spacing(1) }}>
    {value}
  </span>
);

export const DiscountConsole = () => {
  const isMobile = useIsMobile();
  const today = toDayString(new Date());
  const { data, error, isLoading, reload, upsertLocal, removeLocal } =
    useDiscounts();
  const [appName, setAppName] = useState<string | null>(null);
  const [validity, setValidity] = useState<DiscountValidity | null>(null);
  const [isAttentionOnly, setIsAttentionOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorSeed, setEditorSeed] = useState<DiscountEditorSeed | null>(null);
  const [editorDiscountId, setEditorDiscountId] = useState<string | null>(null);
  // Saving a new discount gives it an id; the editor must stay mounted.
  const [editorSession, setEditorSession] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);

  const discounts = data?.discounts ?? [];
  const apps = data?.apps ?? [];
  const canEdit = data?.canEdit === true;
  const canConfigure = data?.canConfigure === true;
  const visible = useMemo(
    () =>
      filterDiscounts(
        discounts,
        { appName, validity, attention: isAttentionOnly, search },
        today,
      ),
    [discounts, appName, validity, isAttentionOnly, search, today],
  );
  const attentionCount = discounts.filter(needsAttention).length;
  const notConnectedApps = apps.filter(
    (app) =>
      !app.isConnected &&
      discounts.some((discount) => discount.appName === app.name),
  );
  const selected =
    discounts.find((discount) => discount.id === selectedId) ?? null;
  const editorDiscount =
    discounts.find((discount) => discount.id === editorDiscountId) ?? null;
  const { detail } = useDiscountDetail(
    selectedId,
    `${selected?.syncStatus}-${selected?.nextSyncAt}-${selected?.syncError}`,
  );
  const { detail: editorDetail } = useDiscountDetail(
    editorDiscountId,
    `${editorDiscount?.syncStatus}-${editorDiscount?.syncError}`,
  );
  const editorErrors: AppErrorItem[] =
    editorDetail?.syncLogs.find((log) => log.result !== 'APPLIED')?.errors ?? [];

  const openCreate = () => {
    setIsConnectionsOpen(false);
    setEditorSession((session) => session + 1);
    const firstConnected = apps.find((app) => app.isConnected) ?? apps[0];

    setEditorDiscountId(null);
    setEditorSeed({
      discountId: null,
      draft: buildEmptyDraft(firstConnected?.id ?? null, firstConnected?.name ?? null),
    });
  };

  const openEdit = (discount: DiscountListItem) => {
    setIsConnectionsOpen(false);
    setEditorSession((session) => session + 1);
    setEditorDiscountId(discount.id);
    setEditorSeed({ discountId: discount.id, draft: toDraft(discount) });
  };

  const openDuplicate = (discount: DiscountListItem) => {
    setIsConnectionsOpen(false);
    setEditorSession((session) => session + 1);

    setEditorDiscountId(null);
    setEditorSeed({
      discountId: null,
      draft: {
        ...toDraft(discount),
        merchantId: null,
        merchantDomain: null,
        discountCode: '',
        startDate: today,
        endDate: addDays(today, 7),
      },
    });
  };

  const save = async (draft: DiscountDraft, isDraft: boolean) => {
    setIsSaving(true);

    try {
      const result = await postAppRoute<DiscountSaveResult & { success: true }>(
        DISCOUNT_CONSOLE_SAVE_ROUTE_PATH,
        { discountId: editorDiscountId, draft, isDraft },
      );

      upsertLocal(result.discount);
      setEditorDiscountId(result.discount.id);
      setEditorSeed((seed) =>
        seed === null ? seed : { ...seed, discountId: result.discount.id },
      );

      if (isDraft) {
        void enqueueSnackbar({ message: t('Draft saved'), variant: 'success' });
      }
    } catch (caught) {
      void enqueueSnackbar({ message: readErrorText(caught), variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const resend = async (discount: DiscountListItem) => {
    setResendingId(discount.id);

    try {
      const result = await postAppRoute<
        DiscountSaveResult & { success: true; result: string }
      >(DISCOUNT_CONSOLE_RESEND_ROUTE_PATH, { discountId: discount.id });

      upsertLocal(result.discount);

      if (result.result === 'APPLIED') {
        void enqueueSnackbar({
          message: t('{app} applied {code}', {
            app: discount.appName ?? '',
            code: discount.discountCode,
          }),
          variant: 'success',
        });
      }
    } catch (caught) {
      void enqueueSnackbar({ message: readErrorText(caught), variant: 'error' });
    } finally {
      setResendingId(null);
    }
  };

  const remove = async (discount: DiscountListItem) => {
    try {
      await postAppRoute(DISCOUNT_CONSOLE_DELETE_ROUTE_PATH, {
        discountId: discount.id,
      });
      removeLocal(discount.id);
      setSelectedId(null);
      void enqueueSnackbar({
        message: t('{code} deleted, {app} is being told', {
          code: discount.discountCode,
          app: discount.appName ?? '',
        }),
        variant: 'success',
      });
    } catch (caught) {
      void enqueueSnackbar({ message: readErrorText(caught), variant: 'error' });
    }
  };

  const rowActions: DiscountActionHandlers = {
    onResend: (discount) => void resend(discount),
    onEdit: openEdit,
    onDuplicate: openDuplicate,
    onDelete: remove,
  };

  const closeEditor = () => {
    setEditorSeed(null);
    setEditorDiscountId(null);
    void reload();
  };

  const countFor = (name: string) =>
    discounts.filter((discount) => discount.appName === name).length;

  const list = (
    <div
      style={{
        background: DISCOUNT_TOKENS.background,
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
          display: 'flex',
          flexShrink: 0,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: spacing(2),
          minHeight: 40,
          padding: `${spacing(1)} ${spacing(2)}`,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            gap: spacing(1),
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
        <FilterButton isOn={appName === null} onClick={() => setAppName(null)}>
          {t('All')}
          <Count value={data === null ? null : discounts.length} />
        </FilterButton>
        {apps
          .filter((app) => countFor(app.name) > 0 || app.isConnected)
          .map((app) => (
            <FilterButton
              key={app.id}
              isOn={appName === app.name}
              onClick={() => setAppName(appName === app.name ? null : app.name)}
            >
              <span
                style={{
                  background: readColorScale(readAppColor(app.name)).solid,
                  borderRadius: 2,
                  display: 'inline-block',
                  height: 8,
                  marginRight: spacing(1.5),
                  width: 8,
                }}
              />
              {app.name}
              <Count value={countFor(app.name)} />
            </FilterButton>
          ))}
        <span style={{ background: DISCOUNT_TOKENS.borderLight, height: 16, margin: `0 ${spacing(1)}`, width: 1 }} />
        {(
          [
            ['active', t('Running')],
            ['upcoming', t('Upcoming')],
            ['expired', t('Expired')],
          ] as const
        ).map(([value, label]) => (
          <FilterButton
            key={value}
            isOn={validity === value}
            onClick={() => setValidity(validity === value ? null : value)}
          >
            {label}
          </FilterButton>
        ))}
        {attentionCount > 0 && (
          <FilterButton
            isOn={isAttentionOnly}
            color="danger"
            onClick={() => setIsAttentionOnly(!isAttentionOnly)}
          >
            {t('Not delivered')}
            <Count value={attentionCount} />
          </FilterButton>
        )}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: spacing(1) }}>
        <div style={{ width: isMobile ? 160 : 200 }}>
          <TextInput
            value={search}
            onChange={setSearch}
            type="search"
            ariaLabel={t('Search discounts')}
            placeholder={t('Search code, shop or reason…')}
            startElement={
              <span style={{ color: DISCOUNT_TOKENS.textTertiary, display: 'inline-flex', paddingLeft: spacing(2) }}>
                <IconSearch size={14} />
              </span>
            }
          />
        </div>
        {canConfigure && (
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            startIcon={<IconPlug size={14} />}
            onClick={() => {
              setEditorSeed(null);
              setIsConnectionsOpen(true);
            }}
          >
            {t('App connections')}
          </Button>
        )}
        {canEdit && (
          <Button variant="solid" color="accent" size="sm" startIcon={<IconPlus size={14} />} onClick={openCreate}>
            {t('New discount')}
          </Button>
        )}
        </div>
      </div>

      {(attentionCount > 0 || notConnectedApps.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, gap: spacing(2), padding: spacing(2) }}>
          {attentionCount > 0 && (
            <Banner color="danger" variant="secondary">
              <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2), width: '100%' }}>
                <span style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
                    {t('{count} discounts did not reach their app.', { count: attentionCount })}
                  </span>{' '}
                  {t('Open one to see what the app answered, fix it and send again.')}
                </span>
                <Button variant="outline" color="neutral" size="sm" onClick={() => setIsAttentionOnly(!isAttentionOnly)}>
                  {isAttentionOnly ? t('Show all') : t('Show them')}
                </Button>
              </div>
            </Banner>
          )}
          {notConnectedApps.map((app) => (
            <Banner key={app.id} color="blue" variant="secondary">
              <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: spacing(2), width: '100%' }}>
                <span style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
                    {t('{app} does not take discounts from the CRM yet.', { app: app.name })}
                  </span>{' '}
                  {t('Its {count} discounts exist only here until its endpoint is set.', {
                    count: countFor(app.name),
                  })}
                </span>
                {canConfigure && (
                  <Button variant="outline" color="neutral" size="sm" onClick={() => setIsConnectionsOpen(true)}>
                    {t('Connect')}
                  </Button>
                )}
              </div>
            </Banner>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {isLoading && data === null ? (
          <DiscountTableSkeleton isMobile={isMobile} hasActions={canEdit} />
        ) : error !== null && data === null ? (
          <div style={{ padding: spacing(4) }}>
            <Banner color="danger" variant="secondary">{error}</Banner>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ color: DISCOUNT_TOKENS.textTertiary, padding: spacing(8), textAlign: 'center' }}>
            {discounts.length === 0
              ? t('No discounts yet. Create one for a merchant from here or from their chat.')
              : t('No discount matches these filters.')}
          </div>
        ) : (
          <DiscountTable
            {...rowActions}
            canEdit={canEdit}
            resendingId={resendingId}
            discounts={visible}
            today={today}
            selectedId={selectedId}
            isMobile={isMobile}
            onSelect={(discountId) => {
              setIsConnectionsOpen(false);
              setSelectedId(selectedId === discountId ? null : discountId);
            }}
          />
        )}
      </div>
    </div>
  );

  const panel =
    editorSeed !== null ? (
      <DiscountEditor
        key={editorSession}
        seed={editorSeed}
        apps={apps}
        savedDiscount={editorDiscount}
        savedErrors={editorErrors}
        width={isMobile ? '100%' : 520}
        isSaving={isSaving}
        onSave={(draft, isDraft) => void save(draft, isDraft)}
        onClose={closeEditor}
      />
    ) : isConnectionsOpen ? (
      <DiscountConnectionsPanel
        width={isMobile ? '100%' : 480}
        onClose={() => setIsConnectionsOpen(false)}
        onChanged={() => void reload()}
      />
    ) : selected === null ? null : (
      <DiscountDetailPanel
        discount={selected}
        syncLogs={detail?.syncLogs ?? null}
        canEdit={canEdit}
        isResending={resendingId === selected.id}
        width={isMobile ? '100%' : 440}
        onClose={() => setSelectedId(null)}
        {...rowActions}
      />
    );

  return (
    <DiscountThemeRoot>
      <div
        style={{
          background: DISCOUNT_TOKENS.background,
          boxSizing: 'border-box',
          display: 'flex',
          height: '100%',
          minHeight: 0,
          width: '100%',
        }}
      >
        {!(isMobile && panel !== null) && list}
        {panel}
      </div>
    </DiscountThemeRoot>
  );
};
