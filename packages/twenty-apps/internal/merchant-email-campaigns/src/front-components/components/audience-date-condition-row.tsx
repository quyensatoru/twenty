import { t } from 'twenty-sdk/front-component';
import { IconTrash } from 'twenty-ui/icon';

import {
  AUDIENCE_DATE_FIELD_OPTIONS,
  AUDIENCE_DATE_OPERATOR_OPTIONS,
  AUDIENCE_DATE_UNIT_OPTIONS,
} from '../../constants/audience-date-options';
import { type AudienceDateCondition } from '../../types/audience-filter';
import { resolveAudienceDateCondition } from '../../utils/resolve-audience-date-condition.util';
import { StudioIconButton } from './studio-icon-button';
import { StudioSelect } from './studio-select';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';

type AudienceDateConditionRowProps = {
  condition: AudienceDateCondition;
  onChange: (condition: AudienceDateCondition) => void;
  onRemove: () => void;
};

const parseAmount = (value: string): number | null => {
  const amount = Number(value);

  return Number.isInteger(amount) && amount > 0 ? amount : null;
};

export const AudienceDateConditionRow = ({
  condition,
  onChange,
  onRemove,
}: AudienceDateConditionRowProps) => {
  const update = (partial: Partial<AudienceDateCondition>) =>
    onChange({ ...condition, ...partial });

  const isRelative =
    condition.operator === 'IN_LAST' || condition.operator === 'MORE_THAN_AGO';
  const hasDate =
    condition.operator === 'BEFORE' ||
    condition.operator === 'ON_OR_AFTER' ||
    condition.operator === 'BETWEEN';
  const isIncomplete =
    resolveAudienceDateCondition(condition, new Date()).kind === 'NO_MATCH';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ alignItems: 'flex-start', display: 'flex', gap: 6 }}>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            flexWrap: 'wrap',
            gap: 6,
            minWidth: 0,
          }}
        >
          <div style={{ width: 140 }}>
            <StudioSelect
              ariaLabel={t('Date field')}
              value={condition.field}
              options={AUDIENCE_DATE_FIELD_OPTIONS}
              onChange={(field) => update({ field })}
            />
          </div>
          <div style={{ width: 140 }}>
            <StudioSelect
              ariaLabel={t('Date condition')}
              value={condition.operator}
              options={AUDIENCE_DATE_OPERATOR_OPTIONS}
              onChange={(operator) => update({ operator })}
            />
          </div>
          {isRelative ? (
            <div
              key="relative"
              style={{ alignItems: 'center', display: 'flex', gap: 6 }}
            >
              <div style={{ width: 64 }}>
                <StudioTextInput
                  type="number"
                  value={
                    condition.amount === null ? '' : String(condition.amount)
                  }
                  onChange={(value) => update({ amount: parseAmount(value) })}
                />
              </div>
              <div style={{ width: 96 }}>
                <StudioSelect
                  ariaLabel={t('Unit')}
                  value={condition.unit}
                  options={AUDIENCE_DATE_UNIT_OPTIONS}
                  onChange={(unit) => update({ unit })}
                />
              </div>
            </div>
          ) : null}
          {hasDate ? (
            <div
              key="calendar"
              style={{ alignItems: 'center', display: 'flex', gap: 6 }}
            >
              <div style={{ width: 150 }}>
                <StudioTextInput
                  type="date"
                  value={condition.date ?? ''}
                  onChange={(value) =>
                    update({ date: value === '' ? null : value })
                  }
                />
              </div>
              {condition.operator === 'BETWEEN' ? (
                <>
                  <span
                    style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}
                  >
                    {t('and')}
                  </span>
                  <div style={{ width: 150 }}>
                    <StudioTextInput
                      type="date"
                      value={condition.endDate ?? ''}
                      onChange={(value) =>
                        update({ endDate: value === '' ? null : value })
                      }
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', height: 32 }}>
          <StudioIconButton label={t('Remove condition')} onClick={onRemove}>
            <IconTrash size={14} />
          </StudioIconButton>
        </div>
      </div>
      {isIncomplete ? (
        <span style={{ color: STUDIO_TOKENS.textDanger, fontSize: 11 }}>
          {t(
            'Incomplete: this condition matches no merchant until it is filled in.',
          )}
        </span>
      ) : null}
    </div>
  );
};
