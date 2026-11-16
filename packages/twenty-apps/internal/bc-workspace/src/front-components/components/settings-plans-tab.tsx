import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import {
  type PlanInput,
  type SettingsPlan,
  type SettingsResult,
  type SettingsSaveBody,
} from '../../types/settings';
import { BcSelect } from './bc-select';
import { CELL_STYLE, HEADER_CELL_STYLE, TABLE_STYLE } from './bc-table';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

type SaveSettings = (body: SettingsSaveBody) => Promise<boolean>;

type PlanDraft = {
  planCode: string;
  name: string;
  monthlyPrice: string;
  rank: string;
  usageAllowance: string;
};

const toText = (value: number | null): string => (value === null ? '' : String(value));

const toDraft = (plan: SettingsPlan | null, planCode = ''): PlanDraft => ({
  planCode: plan?.planCode ?? planCode,
  name: plan?.name ?? '',
  monthlyPrice: toText(plan?.monthlyPrice ?? null),
  rank: toText(plan?.rank ?? null),
  usageAllowance: toText(plan?.usageAllowance ?? null),
});

const toInput = (draft: PlanDraft, appName: string, id: string | null): PlanInput => ({
  id,
  appName,
  planCode: draft.planCode,
  name: draft.name,
  monthlyPrice: draft.monthlyPrice === '' ? null : Number(draft.monthlyPrice),
  rank: draft.rank === '' ? null : Number(draft.rank),
  usageAllowance: draft.usageAllowance === '' ? null : Number(draft.usageAllowance),
});

const NumberCell = ({
  value,
  ariaLabel,
  onChange,
}: {
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}) => (
  <td style={{ ...CELL_STYLE, width: 96 }}>
    <BcTextInput type="number" min="0" ariaLabel={ariaLabel} value={value} onChange={onChange} />
  </td>
);

const SettingsPlanRow = ({
  plan,
  appName,
  codeOptions,
  isSaving,
  onSave,
}: {
  plan: SettingsPlan | null;
  appName: string;
  codeOptions: { value: string; label: string }[];
  isSaving: boolean;
  onSave: SaveSettings;
}) => {
  const initial = toDraft(plan, codeOptions[0]?.value ?? '');
  const [draft, setDraft] = useState<PlanDraft>(initial);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(toDraft(plan, initial.planCode));
  const update = (patch: Partial<PlanDraft>) => setDraft({ ...draft, ...patch });

  return (
    <tr>
      <td style={{ ...CELL_STYLE, width: 150 }}>
        {plan === null ? (
          codeOptions.length > 0 ? (
            <BcSelect
              ariaLabel={t('Plan code')}
              value={draft.planCode}
              options={codeOptions}
              onChange={(planCode) => update({ planCode })}
            />
          ) : (
            <BcTextInput
              ariaLabel={t('Plan code')}
              placeholder={t('Plan code')}
              value={draft.planCode}
              onChange={(planCode) => update({ planCode })}
            />
          )
        ) : (
          <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>{plan.planCode}</span>
        )}
      </td>
      <td style={CELL_STYLE}>
        <BcTextInput
          ariaLabel={t('Plan name')}
          placeholder={draft.planCode}
          value={draft.name}
          onChange={(name) => update({ name })}
        />
      </td>
      <NumberCell
        ariaLabel={t('Monthly price')}
        value={draft.monthlyPrice}
        onChange={(monthlyPrice) => update({ monthlyPrice })}
      />
      <NumberCell ariaLabel={t('Rank')} value={draft.rank} onChange={(rank) => update({ rank })} />
      <NumberCell
        ariaLabel={t('Usage allowance')}
        value={draft.usageAllowance}
        onChange={(usageAllowance) => update({ usageAllowance })}
      />
      <td style={{ ...CELL_STYLE, borderRight: 'none', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'flex', gap: spacing(1) }}>
          <Button
            variant={plan === null ? 'solid' : 'outline'}
            color={plan === null ? 'accent' : 'neutral'}
            size="sm"
            startIcon={plan === null ? <IconPlus size={14} /> : undefined}
            disabled={isSaving || draft.planCode.trim() === '' || (plan !== null && !isDirty)}
            onClick={() =>
              void onSave({ action: 'savePlan', plan: toInput(draft, appName, plan?.id ?? null) }).then(
                (isSaved) => {
                  if (isSaved && plan === null) {
                    setDraft(toDraft(null, ''));
                  }
                },
              )
            }
          >
            {plan === null ? t('Add') : t('Save')}
          </Button>
          {plan !== null && (
            <Button
              variant="ghost"
              color="danger"
              size="sm"
              aria-label={t('Delete plan {code}', { code: plan.planCode })}
              disabled={isSaving}
              startIcon={<IconTrash size={14} />}
              onClick={() => void onSave({ action: 'deletePlan', id: plan.id })}
            />
          )}
        </span>
      </td>
    </tr>
  );
};

export const SettingsPlansTab = ({
  settings,
  isSaving,
  onSave,
}: {
  settings: SettingsResult;
  isSaving: boolean;
  onSave: SaveSettings;
}) => {
  const [appName, setAppName] = useState(settings.appNames[0] ?? '');
  const appPlans = settings.plans.filter((plan) => plan.appName === appName.toUpperCase());
  const pricedCodes = new Set(appPlans.map((plan) => plan.planCode));
  const missingCodes = settings.pricingPlanCodes.filter((code) => !pricedCodes.has(code.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), padding: spacing(4) }}>
      <span style={{ color: BC_TOKENS.textSecondary, fontSize: BC_TOKENS.fontSizeSm }}>
        {t('Rank tells an upgrade from a downgrade, the monthly price values MRR movements, and the usage allowance is what the 80% and 100% upsell rule compares against. A plan without a price shows MRR as unavailable, never as zero.')}
      </span>
      <span style={{ width: 200 }}>
        <BcSelect
          ariaLabel={t('App')}
          prefix={t('App')}
          variant="filter"
          value={appName}
          options={settings.appNames.map((name) => ({ value: name, label: name }))}
          onChange={setAppName}
        />
      </span>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ ...TABLE_STYLE, minWidth: 620 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL_STYLE}>{t('Plan code')}</th>
              <th style={HEADER_CELL_STYLE}>{t('Name')}</th>
              <th style={HEADER_CELL_STYLE}>{t('Price / month')}</th>
              <th style={HEADER_CELL_STYLE}>{t('Rank')}</th>
              <th style={HEADER_CELL_STYLE}>{t('Allowance')}</th>
              <th style={{ ...HEADER_CELL_STYLE, borderRight: 'none' }} />
            </tr>
          </thead>
          <tbody>
            {appPlans.map((plan) => (
              <SettingsPlanRow
                key={`${plan.id}-${plan.monthlyPrice}-${plan.rank}-${plan.usageAllowance}-${plan.name}`}
                plan={plan}
                appName={appName}
                codeOptions={[]}
                isSaving={isSaving}
                onSave={onSave}
              />
            ))}
            <SettingsPlanRow
              key={`new-${appName}-${appPlans.length}`}
              plan={null}
              appName={appName}
              codeOptions={missingCodes}
              isSaving={isSaving}
              onSave={onSave}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};
