import { t } from 'twenty-sdk/front-component';
import { useState } from 'react';

import { PREVIEW_AUDIENCE_ROUTE_PATH } from '../../constants/route-paths';
import {
  type AudienceFilter,
  type InstallStatusFilter,
} from '../../types/audience-filter';
import { postAppRoute } from '../utils/post-app-route.util';
import { readErrorText } from '../utils/read-error-text.util';
import { StudioButton } from './studio-button';
import { StudioCheckbox } from './studio-checkbox';
import { StudioChipInput } from './studio-chip-input';
import { StudioField } from './studio-field';
import { StudioSegmentedControl } from './studio-segmented-control';
import { STUDIO_TOKENS } from './studio-tokens';

const INSTALL_STATUS_OPTIONS: { value: InstallStatusFilter; label: string }[] =
  [
    { value: 'ANY', label: 'Any' },
    { value: 'INSTALLED', label: 'Installed' },
    { value: 'UNINSTALLED', label: 'Uninstalled' },
  ];

const SHOPIFY_PLAN_SUGGESTIONS = [
  'BASIC',
  'SHOPIFY',
  'ADVANCED',
  'PLUS',
  'STARTER',
  'DEVELOPMENT',
];

type AudiencePreview = {
  totalCount: number;
  sample: { id: string; name: string; email: string; appName: string }[];
};

type AudienceFilterEditorProps = {
  filter: AudienceFilter;
  apps: { id: string; name: string }[];
  onChange: (filter: AudienceFilter) => void;
  isAutomation: boolean;
};

export const AudienceFilterEditor = ({
  filter,
  apps,
  onChange,
  isAutomation,
}: AudienceFilterEditorProps) => {
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const update = (partial: Partial<AudienceFilter>) => {
    onChange({ ...filter, ...partial });
    setPreview(null);
  };

  const toggleApp = (appId: string) =>
    update({
      appIds: filter.appIds.includes(appId)
        ? filter.appIds.filter((id) => id !== appId)
        : [...filter.appIds, appId],
    });

  const handlePreview = async () => {
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const result = await postAppRoute<{ success: boolean } & AudiencePreview>(
        PREVIEW_AUDIENCE_ROUTE_PATH,
        { audienceFilter: filter },
      );

      setPreview({ totalCount: result.totalCount, sample: result.sample });
    } catch (error) {
      setPreviewError(readErrorText(error));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <StudioField
        label={t('Apps')}
        hint={
          filter.appIds.length === 0
            ? t('No app picked: merchants of every app.')
            : undefined
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {apps.map((app) => {
            const isSelected = filter.appIds.includes(app.id);

            return (
              <StudioCheckbox
                key={app.id}
                checked={isSelected}
                label={app.name || t('Unnamed app')}
                onChange={() => toggleApp(app.id)}
              />
            );
          })}
        </div>
      </StudioField>
      <StudioField
        label={t('Install status')}
        hint={
          isAutomation
            ? t(
                'Checked again when the email is about to go out, so a delayed win-back skips merchants who reinstalled.',
              )
            : undefined
        }
      >
        <StudioSegmentedControl
          value={filter.installStatus}
          options={INSTALL_STATUS_OPTIONS}
          onChange={(installStatus) => update({ installStatus })}
        />
      </StudioField>
      <StudioField label={t('Shopify plans')}>
        <StudioChipInput
          values={filter.shopifyPlans}
          suggestions={SHOPIFY_PLAN_SUGGESTIONS}
          onChange={(shopifyPlans) => update({ shopifyPlans })}
        />
      </StudioField>
      <StudioField
        label={t('Pricing plans')}
        hint={t(
          'The app plan as stored on the merchant, e.g. FREE, SS_GROWTH.',
        )}
      >
        <StudioChipInput
          values={filter.pricingPlans}
          onChange={(pricingPlans) => update({ pricingPlans })}
        />
      </StudioField>
      <StudioField
        label={t('Countries')}
        hint={t('As stored on the merchant, e.g. US or United States.')}
      >
        <StudioChipInput
          values={filter.countries}
          onChange={(countries) => update({ countries })}
        />
      </StudioField>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
        <StudioButton onClick={handlePreview} isDisabled={isLoadingPreview}>
          {isLoadingPreview ? t('Counting…') : t('Estimate audience')}
        </StudioButton>
        <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
          {t(
            'Merchants without an email or who unsubscribed are always left out.',
          )}
        </span>
      </div>
      {previewError === null ? null : (
        <p style={{ color: STUDIO_TOKENS.textDanger, fontSize: 12, margin: 0 }}>
          {previewError}
        </p>
      )}
      {preview === null ? null : (
        <div
          style={{
            background: STUDIO_TOKENS.backgroundSecondary,
            border: `1px solid ${STUDIO_TOKENS.border}`,
            borderRadius: STUDIO_TOKENS.radiusSmall,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 10,
          }}
        >
          <strong style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}>
            {isAutomation
              ? t('{count} merchants match today', {
                  count: preview.totalCount.toLocaleString(),
                })
              : t('{count} merchants match', {
                  count: preview.totalCount.toLocaleString(),
                })}
          </strong>
          {preview.sample.map((merchant) => (
            <span
              key={merchant.id}
              style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 12 }}
            >
              {merchant.name} · {merchant.email}{' '}
              {merchant.appName ? `· ${merchant.appName}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
