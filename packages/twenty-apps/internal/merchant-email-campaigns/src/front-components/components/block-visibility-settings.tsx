import { t } from 'twenty-sdk/front-component';
import { IconPlus, IconTrash } from 'twenty-ui/icon';

import {
  CUSTOM_CONDITION_VALUE,
  TEMPLATE_CONDITION_CHOICE_OPTIONS,
  TEMPLATE_CONDITION_VALUE_OPTIONS,
  type TemplateConditionChoice,
} from '../../constants/template-condition-options';
import { type TemplateCondition } from '../../types/template-condition';
import { isTemplateConditionValid } from '../../utils/template-condition.util';
import { StudioButton } from './studio-button';
import { StudioField } from './studio-field';
import { StudioIconButton } from './studio-icon-button';
import { StudioSelect } from './studio-select';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';

const NEW_CONDITION: TemplateCondition = {
  value: 'daysSince installedAt',
  operator: '=',
  compareTo: '30',
};

const readChoice = (condition: TemplateCondition): TemplateConditionChoice => {
  if (condition.compareTo === '' && condition.operator === '!=') {
    return 'IS_SET';
  }

  if (condition.compareTo === '' && condition.operator === '=') {
    return 'IS_EMPTY';
  }

  return condition.operator;
};

const applyChoice = (
  condition: TemplateCondition,
  choice: TemplateConditionChoice,
): TemplateCondition => {
  if (choice === 'IS_SET' || choice === 'IS_EMPTY') {
    return {
      ...condition,
      operator: choice === 'IS_SET' ? '!=' : '=',
      compareTo: '',
    };
  }

  return { ...condition, operator: choice };
};

type ConditionRowProps = {
  condition: TemplateCondition;
  onChange: (condition: TemplateCondition) => void;
  onRemove: () => void;
};

const ConditionRow = ({ condition, onChange, onRemove }: ConditionRowProps) => {
  const preset = TEMPLATE_CONDITION_VALUE_OPTIONS.find(
    (option) => option.value === condition.value,
  );
  const isCustom = preset === undefined;
  const isNumber = preset?.isNumber ?? condition.value.startsWith('days');
  const choice = readChoice(condition);
  const choiceOptions = TEMPLATE_CONDITION_CHOICE_OPTIONS.filter(
    (option) => isNumber || !option.isNumberOnly,
  );
  const needsValue = choice !== 'IS_SET' && choice !== 'IS_EMPTY';

  return (
    <div
      style={{
        background: STUDIO_TOKENS.backgroundSecondary,
        border: `1px solid ${STUDIO_TOKENS.border}`,
        borderRadius: STUDIO_TOKENS.radiusSmall,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 8,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StudioSelect
            ariaLabel={t('Condition value')}
            value={isCustom ? CUSTOM_CONDITION_VALUE : condition.value}
            options={[
              ...TEMPLATE_CONDITION_VALUE_OPTIONS,
              { value: CUSTOM_CONDITION_VALUE, label: 'Custom expression' },
            ]}
            onChange={(value) =>
              onChange({
                ...condition,
                value: value === CUSTOM_CONDITION_VALUE ? 'event.' : value,
              })
            }
          />
        </div>
        <StudioIconButton label={t('Remove condition')} onClick={onRemove}>
          <IconTrash size={14} />
        </StudioIconButton>
      </div>
      {isCustom ? (
        <StudioTextInput
          key="custom"
          value={condition.value}
          placeholder="event.plan_name, daysUntil event.ends_at"
          onChange={(value) => onChange({ ...condition, value })}
        />
      ) : null}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StudioSelect
            ariaLabel={t('Comparison')}
            value={choice}
            options={choiceOptions}
            onChange={(nextChoice) =>
              onChange(applyChoice(condition, nextChoice))
            }
          />
        </div>
        {needsValue ? (
          <div key="compare-to" style={{ flex: 1, minWidth: 0 }}>
            <StudioTextInput
              type={isNumber ? 'number' : 'text'}
              value={condition.compareTo}
              onChange={(compareTo) => onChange({ ...condition, compareTo })}
            />
          </div>
        ) : null}
      </div>
      {isTemplateConditionValid(condition) ? null : (
        <span style={{ color: STUDIO_TOKENS.textDanger, fontSize: 11 }}>
          {t('Cannot read this condition, so the block stays hidden.')}
        </span>
      )}
    </div>
  );
};

type BlockVisibilitySettingsProps = {
  conditions: TemplateCondition[];
  onChange: (conditions: TemplateCondition[]) => void;
};

export const BlockVisibilitySettings = ({
  conditions,
  onChange,
}: BlockVisibilitySettingsProps) => (
  <StudioField
    label={t('Show if')}
    hint={
      conditions.length === 0
        ? t('Shown to every merchant.')
        : t(
            'Shown only to merchants matching every condition, checked when the email is sent.',
          )
    }
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {conditions.map((condition, index) => (
        // Keyed on the count too, so removing a row remounts the rest
        // instead of handing one row's typed input to its neighbour.
        <ConditionRow
          key={`${conditions.length}-${index}`}
          condition={condition}
          onChange={(next) =>
            onChange(
              conditions.map((current, currentIndex) =>
                currentIndex === index ? next : current,
              ),
            )
          }
          onRemove={() =>
            onChange(
              conditions.filter((_, currentIndex) => currentIndex !== index),
            )
          }
        />
      ))}
      <div>
        <StudioButton
          variant="ghost"
          startIcon={<IconPlus size={14} />}
          onClick={() => onChange([...conditions, NEW_CONDITION])}
        >
          {t('Add condition')}
        </StudioButton>
      </div>
    </div>
  </StudioField>
);
