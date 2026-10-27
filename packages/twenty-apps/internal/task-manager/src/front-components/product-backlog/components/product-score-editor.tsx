import { t } from 'twenty-sdk/front-component';

import {
  type CompetitorAdoption,
  type MoscowBucket,
  type ProductBacklogSettings,
  type ProductItem,
  type ScoreInputs,
} from '../../../types/product-backlog';
import {
  MOSCOW_BUCKETS,
  readMoscowVotes,
} from '../../../utils/product-backlog/categorical-templates.util';
import {
  type PrioritizationTemplate,
  type ScoreFieldDefinition,
} from '../../../utils/product-backlog/prioritization-template.util';
import {
  formatTemplateScore,
  scoreItem,
} from '../../../utils/product-backlog/prioritization-templates.util';
import {
  COMPETITOR_ADOPTION_LABELS,
  computeCompetitorAdoptionFactor,
  computeIce,
  PHASE_MEANING,
  readCompetitorAdoptions,
} from '../../../utils/product-backlog/sae-ice-caf-template.util';
import { TaskBoardSelect } from '../../components/task-board-select';
import { readTagColor, TASK_TOKENS } from '../../components/task-tokens';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCommitTextInput,
  ProductSectionLabel,
  ProductTextArea,
} from './product-ui';

const EMPTY_VALUE = '';

type ScoreFieldInputProps = {
  field: ScoreFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  isReadOnly: boolean;
  width?: number | string;
};

export const ScoreFieldInput = ({
  field,
  value,
  onChange,
  isReadOnly,
  width,
}: ScoreFieldInputProps) => {
  if (field.kind === 'select') {
    const options = field.options ?? [];
    const selected = options.find((option) => option.value === value);

    if (isReadOnly) {
      return <span style={PRODUCT_TEXT_STYLE}>{selected?.label ?? '—'}</span>;
    }

    return (
      <TaskBoardSelect
        ariaLabel={t(field.label)}
        value={selected === undefined ? EMPTY_VALUE : String(selected.value)}
        width={width ?? field.width ?? 110}
        options={[
          { value: EMPTY_VALUE, label: '—' },
          ...options.map((option) => ({
            value: String(option.value),
            label: t(option.label),
          })),
        ]}
        onChange={(raw) =>
          onChange(
            raw === EMPTY_VALUE
              ? undefined
              : options.find((option) => String(option.value) === raw)?.value,
          )
        }
      />
    );
  }

  return (
    <ProductCommitTextInput
      ariaLabel={t(field.label)}
      type="number"
      width={width ?? field.width ?? 80}
      isDisabled={isReadOnly}
      value={typeof value === 'number' ? String(value) : ''}
      onCommit={(raw) => {
        const parsed = Number(raw);

        onChange(
          raw.trim() === '' || !Number.isFinite(parsed) ? undefined : parsed,
        );
      }}
    />
  );
};

type ProductScoreEditorProps = {
  item: ProductItem;
  template: PrioritizationTemplate;
  settings: ProductBacklogSettings;
  isReadOnly: boolean;
  onChangeInputs: (inputs: ScoreInputs) => void;
  onChangeReasoning: (reasoning: string) => void;
};

// The full form of the active template for one item, with its competitor or
// stakeholder table when the template has one.
export const ProductScoreEditor = ({
  item,
  template,
  settings,
  isReadOnly,
  onChangeInputs,
  onChangeReasoning,
}: ProductScoreEditorProps) => {
  const inputs = item.priorityScores?.[template.id] ?? {};
  const setInput = (key: string, value: unknown) => {
    const next = { ...inputs, [key]: value };

    if (value === undefined) {
      delete next[key];
    }

    onChangeInputs(next);
  };
  const { score, classification } = scoreItem(item, template, settings);
  const scoreText = formatTemplateScore(template, score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {template.fields.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {template.fields.map((field) => (
            <label
              key={field.key}
              title={field.hint === undefined ? undefined : t(field.hint)}
              style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
            >
              <span style={{ ...PRODUCT_MUTED_STYLE, fontWeight: 600 }}>
                {t(field.label)}
              </span>
              <ScoreFieldInput
                field={field}
                value={inputs[field.key]}
                isReadOnly={isReadOnly}
                onChange={(value) => setInput(field.key, value)}
              />
            </label>
          ))}
        </div>
      )}

      {template.special === 'competitors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ProductSectionLabel>{t('Competitor adoption')}</ProductSectionLabel>
          {settings.competitors.length === 0 && (
            <span style={PRODUCT_MUTED_STYLE}>
              {t('Add competitors in Settings to factor them in.')}
            </span>
          )}
          {settings.competitors.map((competitor) => {
            const adoptions = readCompetitorAdoptions(inputs);

            return (
              <div
                key={competitor.id}
                style={{ alignItems: 'center', display: 'flex', gap: 8 }}
              >
                <span style={{ ...PRODUCT_TEXT_STYLE, flex: 1, minWidth: 0 }}>
                  {competitor.name}
                </span>
                <span style={{ ...PRODUCT_MUTED_STYLE, width: 92 }}>
                  {competitor.type === 'DIRECT'
                    ? t('Direct ×{weight}', {
                        weight: settings.competitorWeights.DIRECT,
                      })
                    : t('Indirect ×{weight}', {
                        weight: settings.competitorWeights.INDIRECT,
                      })}
                </span>
                {isReadOnly ? (
                  <span style={PRODUCT_TEXT_STYLE}>
                    {adoptions[competitor.id] === undefined
                      ? t('Not researched')
                      : t(COMPETITOR_ADOPTION_LABELS[adoptions[competitor.id]])}
                  </span>
                ) : (
                  <TaskBoardSelect
                    ariaLabel={competitor.name}
                    width={170}
                    value={adoptions[competitor.id] ?? EMPTY_VALUE}
                    options={[
                      { value: EMPTY_VALUE, label: t('Not researched') },
                      ...(
                        Object.keys(
                          COMPETITOR_ADOPTION_LABELS,
                        ) as CompetitorAdoption[]
                      ).map((adoption) => ({
                        value: adoption,
                        label: `${t(COMPETITOR_ADOPTION_LABELS[adoption])} (${settings.adoptionScores[adoption]})`,
                      })),
                    ]}
                    onChange={(value) => {
                      const next: Record<string, CompetitorAdoption> = {
                        ...adoptions,
                      };

                      if (value === EMPTY_VALUE) {
                        delete next[competitor.id];
                      } else {
                        next[competitor.id] = value as CompetitorAdoption;
                      }

                      setInput('adoption', next);
                    }}
                  />
                )}
              </div>
            );
          })}
          <span style={PRODUCT_MUTED_STYLE}>
            {t('ICE = {ice} · CAF = {caf} (+{boost}% competitor boost)', {
              ice: computeIce(inputs) ?? '—',
              caf: computeCompetitorAdoptionFactor(inputs, settings).toFixed(3),
              boost: Math.round(
                computeCompetitorAdoptionFactor(inputs, settings) * 100,
              ),
            })}
          </span>
        </div>
      )}

      {template.special === 'votes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ProductSectionLabel>{t('Stakeholder votes')}</ProductSectionLabel>
          {settings.stakeholders.map((stakeholder) => {
            const votes = readMoscowVotes(inputs);

            return (
              <div
                key={stakeholder.id}
                style={{ alignItems: 'center', display: 'flex', gap: 8 }}
              >
                <span style={{ ...PRODUCT_TEXT_STYLE, flex: 1 }}>
                  {t(stakeholder.name)}
                </span>
                <MoscowVotePicker
                  value={votes[stakeholder.id] ?? null}
                  isReadOnly={isReadOnly}
                  onChange={(bucket) => {
                    const next: Record<string, MoscowBucket> = { ...votes };

                    if (bucket === null) {
                      delete next[stakeholder.id];
                    } else {
                      next[stakeholder.id] = bucket;
                    }

                    setInput('votes', next);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          ...PRODUCT_TEXT_STYLE,
          alignItems: 'baseline',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={PRODUCT_MUTED_STYLE}>{t('Result')}</span>
        <strong
          style={{
            color:
              classification === null
                ? TASK_TOKENS.textPrimary
                : readTagColor(classification.color).text,
          }}
        >
          {score === null
            ? t('Not enough input yet')
            : scoreText === ''
              ? t(classification?.label ?? '')
              : scoreText}
        </strong>
        {classification !== null && scoreText !== '' && score !== null && (
          <span style={{ color: readTagColor(classification.color).text }}>
            {t(classification.label)}
          </span>
        )}
        {template.id === 'sae-ice-caf' && classification !== null && (
          <span style={PRODUCT_MUTED_STYLE}>
            — {t(PHASE_MEANING[classification.order])}
          </span>
        )}
      </div>
      <ProductTextArea
        ariaLabel={t('Score reasoning')}
        value={item.scoreReasoning ?? ''}
        placeholder={t('Why this score? Data, customer feedback, competitors…')}
        isDisabled={isReadOnly}
        onCommit={onChangeReasoning}
      />
    </div>
  );
};

type MoscowVotePickerProps = {
  value: MoscowBucket | null;
  onChange: (bucket: MoscowBucket | null) => void;
  isReadOnly: boolean;
};

export const MoscowVotePicker = ({
  value,
  onChange,
  isReadOnly,
}: MoscowVotePickerProps) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {(Object.keys(MOSCOW_BUCKETS) as MoscowBucket[]).map((bucket) => {
      const isSelected = value === bucket;
      const color = readTagColor(MOSCOW_BUCKETS[bucket].color);

      return (
        <button
          key={bucket}
          type="button"
          disabled={isReadOnly}
          title={t(MOSCOW_BUCKETS[bucket].label)}
          onClick={() => onChange(isSelected ? null : bucket)}
          style={{
            background: isSelected ? color.background : 'transparent',
            border: `1px solid ${isSelected ? color.text : TASK_TOKENS.border}`,
            borderRadius: TASK_TOKENS.radiusExtraSmall,
            color: isSelected ? color.text : TASK_TOKENS.textTertiary,
            cursor: isReadOnly ? 'default' : 'pointer',
            fontFamily: TASK_TOKENS.fontFamily,
            fontSize: 12,
            fontWeight: 600,
            height: 24,
            width: 24,
          }}
        >
          {bucket}
        </button>
      );
    })}
  </span>
);
