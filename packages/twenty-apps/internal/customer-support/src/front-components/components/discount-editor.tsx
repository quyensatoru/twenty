import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPercentage, IconRefresh, IconSearch, IconX } from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import {
  Button,
  Checkbox,
  SegmentedControl,
} from 'twenty-ui/primitives/input';

import {
  DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH,
  type DiscountScope,
  type DiscountType,
  FOREVER_INTERVALS,
} from '../../constants/discount';
import {
  type AppErrorItem,
  type DiscountAppOption,
  type DiscountListItem,
  type MerchantOption,
  type MerchantSearchResult,
} from '../../types/discount';
import {
  type DiscountDraft,
  type DiscountDraftField,
  type DiscountRuleCode,
  isForeverIntervals,
  listDiscountWarnings,
  normalizeDiscountCode,
  suggestDiscountCode,
  validateDiscountDraft,
} from '../../utils/discount-rules.util';
import {
  addDays,
  formatDiscountValue,
  formatShortDay,
  toDayString,
} from '../utils/discount-display.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { AppErrorList, readFieldLabel } from './discount-detail-panel';
import { Field, InputSuffix, TextAreaInput, TextInput } from './discount-fields';
import { AppBadge } from './discount-parts';
import { DiscountSidePanel } from './discount-side-panel';
import { readSyncStatusLabel } from './discount-sync-pill';
import {
  DISCOUNT_TOKENS,
  readAppColor,
  readColorScale,
  spacing,
} from './discount-theme';

export type DiscountEditorSeed = {
  discountId: string | null;
  draft: DiscountDraft;
};

type DiscountEditorProps = {
  seed: DiscountEditorSeed;
  apps: DiscountAppOption[];
  // The saved discount as the list last saw it, so the delivery result shows
  // here as soon as the app answers.
  savedDiscount: DiscountListItem | null;
  savedErrors: AppErrorItem[];
  width: number | string;
  isSaving: boolean;
  onSave: (draft: DiscountDraft, isDraft: boolean) => void;
  onClose: () => void;
};

const PERCENT_PRESETS = [10, 20, 25, 50, 100];
const INTERVAL_PRESETS = [1, 3, 6, 12, FOREVER_INTERVALS];
const PERIOD_PRESETS = [7, 30, 90];

// Stored in English so reports group them the same whatever the UI language.
const readReasonPresets = () => [
  { value: 'Touch point', label: t('Touch point') },
  { value: 'Compensation', label: t('Compensation') },
  { value: 'Returning customer', label: t('Returning customer') },
  { value: 'Campaign', label: t('Campaign') },
];

const readRuleMessage = (code: DiscountRuleCode): string => {
  switch (code) {
    case 'required':
      return t('Required');
    case 'not_positive':
      return t('Must be above 0');
    case 'over_hundred_percent':
      return t('Cannot be above 100%');
    case 'not_whole':
      return t('Must be a whole number');
    case 'end_before_start':
      return t('Ends before it starts');
    case 'code_format':
      return t('Only A–Z, 0–9, _ and -, 3 to 40 characters');
    case 'domain_format':
      return t('One shop domain per line, like shop.myshopify.com');
    case 'too_many_domains':
      return t('At most 20 shops');
  }
};

const PresetRow = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>{children}</div>
);

const Preset = ({
  isOn,
  onClick,
  children,
}: {
  isOn: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Button
    variant={isOn ? 'soft' : 'ghost'}
    color={isOn ? 'accent' : 'neutral'}
    size="sm"
    onClick={onClick}
  >
    {children}
  </Button>
);

const parseNumber = (value: string): number | null => {
  const trimmed = value.trim().replace(',', '.');

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
};

const MerchantPicker = ({
  appId,
  merchantId,
  merchantDomain,
  hasError,
  onPick,
}: {
  appId: string | null;
  merchantId: string | null;
  merchantDomain: string | null;
  hasError: boolean;
  onPick: (merchant: MerchantOption | null) => void;
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MerchantOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);

  const search = (value: string) => {
    setQuery(value);

    if (timer.current !== null) {
      clearTimeout(timer.current);
    }

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    timer.current = setTimeout(() => {
      const current = ++generation.current;

      setIsSearching(true);
      postAppRoute<MerchantSearchResult & { success: true }>(
        DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH,
        { query: value, appId },
      )
        .then((result) => {
          if (current === generation.current) {
            setResults(result.merchants);
          }
        })
        .catch(() => {
          if (current === generation.current) {
            setResults([]);
          }
        })
        .finally(() => {
          if (current === generation.current) {
            setIsSearching(false);
          }
        });
    }, 250);
  };

  if (merchantId !== null) {
    return (
      <div
        style={{
          alignItems: 'center',
          border: `1px solid ${DISCOUNT_TOKENS.border}`,
          borderRadius: DISCOUNT_TOKENS.radiusSmall,
          display: 'flex',
          gap: spacing(2),
          height: 32,
          padding: `0 ${spacing(1)} 0 ${spacing(2)}`,
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {merchantDomain ?? merchantId}
        </span>
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label={t('Choose another merchant')}
          startIcon={<IconX size={14} />}
          onClick={() => onPick(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
      <TextInput
        value={query}
        ariaLabel={t('Search merchant')}
        placeholder={t('Type part of the shop domain…')}
        hasError={hasError}
        startElement={
          <span style={{ color: DISCOUNT_TOKENS.textTertiary, display: 'inline-flex', paddingLeft: spacing(2) }}>
            <IconSearch size={14} />
          </span>
        }
        endElement={isSearching ? <InputSuffix>{t('Searching…')}</InputSuffix> : undefined}
        onChange={search}
      />
      {results.length > 0 && (
        <div
          style={{
            border: `1px solid ${DISCOUNT_TOKENS.border}`,
            borderRadius: DISCOUNT_TOKENS.radiusSmall,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 220,
            overflowY: 'auto',
            padding: spacing(1),
          }}
        >
          {results.map((merchant) => (
            <button
              key={merchant.id}
              type="button"
              onClick={() => {
                setResults([]);
                setQuery('');
                onPick(merchant);
              }}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: DISCOUNT_TOKENS.radiusSmall,
                color: DISCOUNT_TOKENS.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                font: 'inherit',
                gap: spacing(2),
                height: 32,
                justifyContent: 'space-between',
                padding: `0 ${spacing(2)}`,
                textAlign: 'left',
              }}
            >
              <span>{merchant.name}</span>
              <AppBadge appName={merchant.appName} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const readIntervalsPhrase = (limitInIntervals: number | null): string => {
  if (limitInIntervals === null) {
    return '';
  }

  if (isForeverIntervals(limitInIntervals)) {
    return t('every billing cycle');
  }

  return limitInIntervals === 1
    ? t('the first billing cycle')
    : t('the first {count} billing cycles', { count: limitInIntervals });
};

export const DiscountEditor = ({
  seed,
  apps,
  savedDiscount,
  savedErrors,
  width,
  isSaving,
  onSave,
  onClose,
}: DiscountEditorProps) => {
  const [draft, setDraft] = useState<DiscountDraft>(() =>
    seed.draft.discountCode.length > 0
      ? seed.draft
      : { ...seed.draft, discountCode: suggestDiscountCode(seed.draft) },
  );
  const [isCodeTouched, setIsCodeTouched] = useState(
    seed.draft.discountCode.length > 0,
  );
  // Read inside updaters through a ref: the sandbox can call a handler from
  // an older render, whose state would be stale.
  const isCodeTouchedRef = useRef(seed.draft.discountCode.length > 0);
  const markCodeTouched = (isTouched: boolean) => {
    isCodeTouchedRef.current = isTouched;
    setIsCodeTouched(isTouched);
  };
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isCustomIntervals, setIsCustomIntervals] = useState(
    seed.draft.limitInIntervals !== null &&
      !INTERVAL_PRESETS.includes(seed.draft.limitInIntervals) &&
      !isForeverIntervals(seed.draft.limitInIntervals),
  );

  // Until the code is typed by hand it follows the app, amount and shop.
  const update = (patch: Partial<DiscountDraft>) =>
    setDraft((previous) => {
      const next = { ...previous, ...patch };

      return isCodeTouchedRef.current
        ? next
        : { ...next, discountCode: suggestDiscountCode(next) };
    });

  const errors = useMemo(() => validateDiscountDraft(draft), [draft]);
  const warnings = useMemo(() => listDiscountWarnings(draft), [draft]);
  const errorFor = (field: DiscountDraftField): string | undefined => {
    const error = hasTriedSubmit
      ? errors.find((candidate) => candidate.field === field)
      : undefined;

    return error === undefined ? undefined : readRuleMessage(error.code);
  };
  const appErrorFields = new Set(
    savedErrors.map((error) => error.field).filter((field) => field !== null),
  );
  const isRejected =
    savedDiscount?.syncStatus === 'REJECTED' ||
    savedDiscount?.syncStatus === 'FAILED';
  const hasProblem = (field: DiscountDraftField, ...appFields: string[]) =>
    errorFor(field) !== undefined ||
    (isRejected && [field, ...appFields].some((name) => appErrorFields.has(name)));

  const selectedApp = apps.find((app) => app.id === draft.appId) ?? null;
  const appName = selectedApp?.name ?? draft.appName ?? t('the app');
  const isEditing = seed.discountId !== null;
  const appColor = readColorScale(readAppColor(selectedApp?.name ?? draft.appName));

  useEffect(() => {
    if (savedDiscount?.syncStatus === 'APPLIED') {
      setHasTriedSubmit(false);
    }
  }, [savedDiscount?.syncStatus]);

  const submit = (isDraft: boolean) => {
    setHasTriedSubmit(true);

    if (!isDraft && errors.length > 0) {
      return;
    }

    onSave(
      { ...draft, discountCode: normalizeDiscountCode(draft.discountCode) },
      isDraft,
    );
  };

  const shopLabel =
    draft.scope === 'SINGLE'
      ? (draft.merchantDomain ?? t('The merchant'))
      : draft.scope === 'MULTI'
        ? t('Each listed shop')
        : t('Any shop of {app}', { app: appName });

  const resultBanner = (() => {
    // Discounts made before tracking have no status: nothing to report.
    if (
      savedDiscount === null ||
      savedDiscount.syncStatus === null ||
      savedDiscount.syncStatus === 'DRAFT'
    ) {
      return null;
    }

    const status = savedDiscount.syncStatus;

    if (status === 'APPLIED') {
      return (
        <div
          style={{
            background: readColorScale('green').soft,
            borderRadius: DISCOUNT_TOKENS.radius,
            color: readColorScale('green').ink,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(1),
            padding: `${spacing(2)} ${spacing(3)}`,
          }}
        >
          <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
            {t('{app} applied the discount', { app: appName })}
          </span>
          <span>
            {t('{code} can be used now.', { code: savedDiscount.discountCode })}
            {savedDiscount.externalId !== null && ` ID ${savedDiscount.externalId}`}
          </span>
        </div>
      );
    }

    return (
      <Banner
        color={status === 'REJECTED' || status === 'FAILED' ? 'danger' : 'blue'}
        variant="secondary"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
          <span style={{ fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
            {status === 'PENDING'
              ? t('Sending to {app}…', { app: appName })
              : status === 'NOT_CONNECTED'
                ? t('Saved. {app} has no discount endpoint yet, so it was not sent.', { app: appName })
                : `${appName}: ${readSyncStatusLabel(status)}`}
          </span>
          {status === 'PENDING' && (
            <span>{t('Usually under 2 seconds. You can close this, the list keeps the result.')}</span>
          )}
          {(status === 'REJECTED' || status === 'FAILED') && (
            <>
              {savedErrors.length > 0 ? (
                <AppErrorList errors={savedErrors} />
              ) : (
                savedDiscount.syncError !== null && <span>{savedDiscount.syncError}</span>
              )}
              <span>
                {status === 'REJECTED'
                  ? t('Fix the highlighted fields and send again.')
                  : t('The CRM retries on its own; you can also send again.')}
              </span>
            </>
          )}
        </div>
      </Banner>
    );
  })();

  return (
    <DiscountSidePanel
      ariaLabel={isEditing ? t('Edit discount') : t('New discount')}
      width={width}
      onClose={onClose}
      icon={<IconPercentage size={16} />}
      title={isEditing ? t('Edit {code}', { code: seed.draft.discountCode }) : t('New discount')}
      footer={
        <>
          <Button variant="outline" color="neutral" size="md" onClick={onClose}>
            {savedDiscount?.syncStatus === 'APPLIED' ? t('Done') : t('Cancel')}
          </Button>
          {(seed.discountId === null || savedDiscount?.syncStatus === 'DRAFT') && (
            <Button variant="outline" color="neutral" size="md" disabled={isSaving} onClick={() => submit(true)}>
              {t('Save draft')}
            </Button>
          )}
          <Button
            variant="solid"
            color="accent"
            size="md"
            loading={isSaving}
            disabled={isSaving || savedDiscount?.syncStatus === 'PENDING'}
            onClick={() => submit(false)}
          >
            {isRejected
              ? t('Send again to {app}', { app: appName })
              : isEditing || savedDiscount !== null
                ? t('Save and send to {app}', { app: appName })
                : t('Create and send to {app}', { app: appName })}
          </Button>
        </>
      }
    >
      <div
        style={{
          borderBottom: `1px solid ${DISCOUNT_TOKENS.borderLight}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(3),
          padding: spacing(4),
        }}
      >
        <div
          style={{
            background: appColor.soft,
            borderRadius: DISCOUNT_TOKENS.radius,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(1),
            padding: `${spacing(3)} ${spacing(4)}`,
          }}
        >
          <span style={{ color: appColor.ink, fontSize: DISCOUNT_TOKENS.fontSizeSm, fontWeight: DISCOUNT_TOKENS.fontWeightMedium }}>
            {t('The merchant gets')}
          </span>
          <span style={{ fontSize: DISCOUNT_TOKENS.fontSizeLg, fontWeight: DISCOUNT_TOKENS.fontWeightSemiBold, lineHeight: 1.35 }}>
            {draft.discountValue === null
              ? t('Choose a discount')
              : t('{value} off {cycles} of {app}', {
                  value: formatDiscountValue(draft.discountType, draft.discountValue),
                  cycles: readIntervalsPhrase(draft.limitInIntervals),
                  app: appName,
                })}
          </span>
          <span style={{ color: DISCOUNT_TOKENS.textSecondary, lineHeight: 1.5 }}>
            {t('{shop} enters {code} on the pricing page.', {
              shop: shopLabel,
              code: draft.discountCode.length > 0 ? draft.discountCode : '…',
            })}{' '}
            {draft.limitUsage !== null && t('Uses allowed: {count}.', { count: draft.limitUsage })}{' '}
            {draft.startDate !== null && draft.endDate !== null &&
              t('From {start} to {end}.', { start: formatShortDay(draft.startDate), end: formatShortDay(draft.endDate) })}
            {!draft.status && ` ${t('The code is turned off.')}`}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: DISCOUNT_TOKENS.fontSizeSm, gap: spacing(1) }}>
          {errors.length === 0 ? (
            <span style={{ color: readColorScale('green').ink }}>
              ✓ {t('Everything {app} needs is filled in', { app: appName })}
            </span>
          ) : (
            errors.map((error) => (
              <span
                key={`${error.field}-${error.code}`}
                style={{ color: hasTriedSubmit ? DISCOUNT_TOKENS.danger : DISCOUNT_TOKENS.textTertiary }}
              >
                {hasTriedSubmit ? '✕' : '○'} {readFieldLabel(error.field)}: {readRuleMessage(error.code)}
              </span>
            ))
          )}
          {warnings.includes('app_ignores_assigned_domains') && (
            <span style={{ color: readColorScale('orange').ink }}>
              ! {t('{app} ignores the shop list', { app: appName })}
            </span>
          )}
        </div>

        {resultBanner}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(5), padding: spacing(4) }}>
        <Field
          label={t('App')}
          error={errorFor('appId') === undefined ? undefined : t('Choose an app')}
          hint={
            selectedApp !== null && !selectedApp.isConnected
              ? t('{app} has no discount endpoint yet. The discount is saved but not sent until an admin connects it under App connections.', { app: selectedApp.name })
              : undefined
          }
        >
          <SegmentedControl
            aria-label={t('App')}
            itemWidth="equal"
            value={draft.appId ?? ''}
            onValueChange={(appId) => {
              const app = apps.find((candidate) => candidate.id === appId) ?? null;

              update({ appId, appName: app?.name ?? null, merchantId: null, merchantDomain: null });
            }}
            options={apps.map((app) => ({ value: app.id, label: app.name }))}
          />
        </Field>

        <Field
          label={t('For')}
          error={
            errorFor('merchantId') !== undefined
              ? t('Choose the merchant')
              : errorFor('assignedDomains')
          }
          hint={
            warnings.includes('app_ignores_assigned_domains')
              ? t('{app} does not limit codes to shops yet: any shop that has the code can use it.', { app: appName })
              : draft.scope === 'ALL'
                ? t('Any shop of the app that types the code can use it, up to the number of uses below.')
                : undefined
          }
        >
          <SegmentedControl<DiscountScope>
            aria-label={t('For')}
            itemWidth="equal"
            value={draft.scope}
            onValueChange={(scope) => update({ scope })}
            options={[
              { value: 'SINGLE', label: t('One merchant') },
              { value: 'MULTI', label: t('Listed shops') },
              { value: 'ALL', label: t('Any shop') },
            ]}
          />
          {draft.scope === 'SINGLE' && (
            <MerchantPicker
              appId={draft.appId}
              merchantId={draft.merchantId}
              merchantDomain={draft.merchantDomain}
              hasError={hasProblem('merchantId', 'assignedDomains', 'scope')}
              onPick={(merchant) =>
                update({ merchantId: merchant?.id ?? null, merchantDomain: merchant?.name ?? null })
              }
            />
          )}
          {draft.scope === 'MULTI' && (
            <TextAreaInput
              ariaLabel={t('Shop domains')}
              value={draft.assignedDomains.join('\n')}
              placeholder={'shop-one.myshopify.com\nshop-two.myshopify.com'}
              hasError={hasProblem('assignedDomains', 'scope')}
              onChange={(value) => update({ assignedDomains: value.split(/[\n,]/) })}
            />
          )}
        </Field>

        <Field
          label={t('Discount')}
          error={errorFor('discountValue')}
          hint={draft.discountType === 'PERCENTAGE' ? t('A whole percent: 25 means 25%, the same for every app.') : undefined}
        >
          <div style={{ display: 'grid', gap: spacing(2), gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
            <SegmentedControl<DiscountType>
              aria-label={t('Discount type')}
              itemWidth="equal"
              value={draft.discountType}
              onValueChange={(discountType) => update({ discountType })}
              options={[
                { value: 'PERCENTAGE', label: t('Percent') },
                { value: 'FIX_AMOUNT', label: t('Amount') },
              ]}
            />
            <TextInput
              ariaLabel={t('Discount value')}
              type="number"
              value={draft.discountValue === null ? '' : `${draft.discountValue}`}
              hasError={hasProblem('discountValue', 'discountType')}
              endElement={<InputSuffix>{draft.discountType === 'PERCENTAGE' ? '%' : 'USD'}</InputSuffix>}
              onChange={(value) => update({ discountValue: parseNumber(value) })}
            />
          </div>
          {draft.discountType === 'PERCENTAGE' && (
            <PresetRow>
              {PERCENT_PRESETS.map((preset) => (
                <Preset key={preset} isOn={draft.discountValue === preset} onClick={() => update({ discountValue: preset })}>
                  {preset}%
                </Preset>
              ))}
            </PresetRow>
          )}
        </Field>

        <Field label={t('Lasts')} aside={t('billing cycles')} error={errorFor('limitInIntervals')}>
          <PresetRow>
            {INTERVAL_PRESETS.map((preset) => (
              <Preset
                key={preset}
                isOn={
                  !isCustomIntervals &&
                  (preset === FOREVER_INTERVALS
                    ? isForeverIntervals(draft.limitInIntervals)
                    : draft.limitInIntervals === preset)
                }
                onClick={() => {
                  setIsCustomIntervals(false);
                  update({ limitInIntervals: preset });
                }}
              >
                {preset === FOREVER_INTERVALS
                  ? t('Forever')
                  : preset === 1
                    ? t('First cycle')
                    : t('{count} cycles', { count: preset })}
              </Preset>
            ))}
            <Preset isOn={isCustomIntervals} onClick={() => setIsCustomIntervals(true)}>
              {t('Custom')}
            </Preset>
          </PresetRow>
          {isCustomIntervals && (
            <TextInput
              ariaLabel={t('Billing cycles')}
              type="number"
              value={draft.limitInIntervals === null ? '' : `${draft.limitInIntervals}`}
              hasError={hasProblem('limitInIntervals')}
              endElement={<InputSuffix>{t('cycles')}</InputSuffix>}
              onChange={(value) => update({ limitInIntervals: parseNumber(value) })}
            />
          )}
        </Field>

        <div style={{ display: 'grid', gap: spacing(3), gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
          <Field label={t('Valid')} error={errorFor('endDate')}>
            <div style={{ display: 'grid', gap: spacing(2), gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
              <TextInput
                ariaLabel={t('Start date')}
                type="date"
                value={draft.startDate ?? ''}
                hasError={hasProblem('endDate', 'startDate')}
                onChange={(value) => update({ startDate: value.length > 0 ? value : null })}
              />
              <TextInput
                ariaLabel={t('End date')}
                type="date"
                value={draft.endDate ?? ''}
                hasError={hasProblem('endDate')}
                onChange={(value) => update({ endDate: value.length > 0 ? value : null })}
              />
            </div>
            <PresetRow>
              {PERIOD_PRESETS.map((days) => (
                <Preset
                  key={days}
                  isOn={draft.startDate !== null && draft.endDate === addDays(draft.startDate, days)}
                  onClick={() => {
                    const start = draft.startDate ?? toDayString(new Date());

                    update({ startDate: start, endDate: addDays(start, days) });
                  }}
                >
                  {t('{count} days', { count: days })}
                </Preset>
              ))}
            </PresetRow>
          </Field>
          <Field
            label={t('Uses')}
            error={errorFor('limitUsage')}
            hint={draft.scope === 'SINGLE' ? t('1 for one merchant') : t('Across all shops')}
          >
            <TextInput
              ariaLabel={t('Number of uses')}
              type="number"
              value={draft.limitUsage === null ? '' : `${draft.limitUsage}`}
              hasError={hasProblem('limitUsage')}
              endElement={<InputSuffix>{t('times')}</InputSuffix>}
              onChange={(value) => update({ limitUsage: parseNumber(value) })}
            />
          </Field>
        </div>

        <Field
          label={t('Code')}
          aside={isCodeTouched ? undefined : t('suggested, you can change it')}
          error={errorFor('discountCode')}
          hint={t('Saved in capitals, spaces and tabs removed.')}
        >
          <TextInput
            ariaLabel={t('Discount code')}
            value={draft.discountCode}
            hasError={hasProblem('discountCode')}
            endElement={
              isCodeTouched ? (
                <Button
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  startIcon={<IconRefresh size={14} />}
                  onClick={() => {
                    markCodeTouched(false);
                    setDraft((previous) => ({ ...previous, discountCode: suggestDiscountCode(previous) }));
                  }}
                >
                  {t('Suggest')}
                </Button>
              ) : undefined
            }
            onChange={(value) => {
              markCodeTouched(true);
              setDraft((previous) => ({ ...previous, discountCode: value }));
            }}
          />
        </Field>

        <Field label={t('Reason')}>
          <PresetRow>
            {readReasonPresets().map((preset) => (
              <Preset key={preset.value} isOn={draft.reason === preset.value} onClick={() => update({ reason: preset.value })}>
                {preset.label}
              </Preset>
            ))}
          </PresetRow>
          <TextInput
            ariaLabel={t('Reason')}
            value={draft.reason}
            placeholder={t('Why this merchant gets a discount')}
            onChange={(value) => setDraft((previous) => ({ ...previous, reason: value }))}
          />
        </Field>

        <label style={{ alignItems: 'center', cursor: 'pointer', display: 'flex', gap: spacing(2) }}>
          <Checkbox
            checked={draft.status}
            onCheckedChange={() => setDraft((previous) => ({ ...previous, status: !previous.status }))}
            size="md"
            color="accent"
            hoverable={false}
          />
          {t('Code can be used')}
        </label>
      </div>
    </DiscountSidePanel>
  );
};
