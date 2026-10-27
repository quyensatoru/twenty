import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconAdjustments, IconPlus, IconTrash } from 'twenty-ui/icon';

import { AUTOMATIC_READINESS_CRITERION_IDS } from '../../../constants/product-backlog';
import {
  type CompetitorAdoption,
  type CompetitorType,
  type MoscowBucket,
  type ProductBacklogSettings,
} from '../../../types/product-backlog';
import { MOSCOW_BUCKETS } from '../../../utils/product-backlog/categorical-templates.util';
import {
  findPrioritizationTemplate,
  PRIORITIZATION_TEMPLATES,
} from '../../../utils/product-backlog/prioritization-templates.util';
import { COMPETITOR_ADOPTION_LABELS } from '../../../utils/product-backlog/sae-ice-caf-template.util';
import { TaskBoardSelect } from '../../components/task-board-select';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { TaskIconButton } from '../../components/task-icon-button';
import {
  TAG_COLORS,
  TASK_THIN_SCROLLBAR_STYLE,
  TASK_TOKENS,
} from '../../components/task-tokens';
import { type ProductViewProps } from '../types/product-view-props';
import { ProductAccessSettings } from './product-access-settings';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCard,
  ProductCommitTextInput,
  ProductSectionLabel,
} from './product-ui';

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

const readNumber = (raw: string, fallback: number) => {
  const parsed = Number(raw);

  return raw.trim() === '' || !Number.isFinite(parsed) ? fallback : parsed;
};

type SettingsUpdate = (patch: Partial<ProductBacklogSettings>) => void;

// Goals, the Definition of Ready and the scoring template are the team's own
// rules: everything else in the Product Backlog reads them from here.
export const ProductSettingsView = ({
  data,
  actions,
  inset,
  isMobile,
}: ProductViewProps) => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const settings = data.settings;
  const isReadOnly = !data.canWrite;
  const update: SettingsUpdate = (patch) => void actions.updateSettings(patch);
  const template = findPrioritizationTemplate(settings.activeTemplateId);
  const hasConfig = template.id === 'sae-ice-caf' || template.id === 'moscow';
  const configSummary =
    template.id === 'sae-ice-caf'
      ? t(
          '{count} competitors · Direct ×{direct} / Indirect ×{indirect} · Phases {one} / {two} / {three}',
          {
            count: settings.competitors.length,
            direct: settings.competitorWeights.DIRECT,
            indirect: settings.competitorWeights.INDIRECT,
            one: settings.phaseThresholds.phaseOne,
            two: settings.phaseThresholds.phaseTwo,
            three: settings.phaseThresholds.phaseThree,
          },
        )
      : template.id === 'moscow'
        ? t(
            'M {must} · S {should} · C {could} · W {wont} · {count} stakeholders',
            {
              must: settings.moscowPoints.M,
              should: settings.moscowPoints.S,
              could: settings.moscowPoints.C,
              wont: settings.moscowPoints.W,
              count: settings.stakeholders.length,
            },
          )
        : t('This template has no extra configuration.');
  const automaticIds = new Set<string>(AUTOMATIC_READINESS_CRITERION_IDS);

  return (
    <div
      style={{
        display: 'grid',
        flex: 1,
        gap: 14,
        gridAutoRows: 'min-content',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        minHeight: 0,
        overflowY: 'auto',
        padding: `12px ${inset.right}px 24px ${inset.left}px`,
        ...TASK_THIN_SCROLLBAR_STYLE,
      }}
    >
      <ProductCard title={t('Strategic goals')}>
        <span style={PRODUCT_MUTED_STYLE}>
          {t(
            'The roadmap themes or OKRs that epics and items serve. Insights flags items that serve none.',
          )}
        </span>
        {settings.goals.map((goal) => (
          <div
            key={goal.id}
            style={{ alignItems: 'center', display: 'flex', gap: 6 }}
          >
            <TaskBoardSelect
              ariaLabel={t('Colour')}
              width={120}
              isDisabled={isReadOnly}
              value={goal.color}
              options={Object.keys(TAG_COLORS).map((color) => ({
                value: color,
                label: color,
                color,
              }))}
              onChange={(color) =>
                update({
                  goals: settings.goals.map((candidate) =>
                    candidate.id === goal.id
                      ? { ...candidate, color }
                      : candidate,
                  ),
                })
              }
            />
            <ProductCommitTextInput
              ariaLabel={t('Goal name')}
              value={goal.name}
              isDisabled={isReadOnly}
              onCommit={(name) =>
                name.trim() !== '' &&
                update({
                  goals: settings.goals.map((candidate) =>
                    candidate.id === goal.id
                      ? { ...candidate, name }
                      : candidate,
                  ),
                })
              }
            />
            {!isReadOnly && (
              <TaskIconButton
                label={t('Remove goal')}
                onClick={() =>
                  update({
                    goals: settings.goals.filter(
                      (candidate) => candidate.id !== goal.id,
                    ),
                  })
                }
              >
                <IconTrash size={14} />
              </TaskIconButton>
            )}
          </div>
        ))}
        {!isReadOnly && (
          <div>
            <TaskButton
              size="small"
              variant="ghost"
              onClick={() =>
                update({
                  goals: [
                    ...settings.goals,
                    {
                      id: createId('goal'),
                      name: t('New goal'),
                      color: 'purple',
                    },
                  ],
                })
              }
            >
              <IconPlus size={14} />
              {t('Add goal')}
            </TaskButton>
          </div>
        )}
      </ProductCard>

      <ProductCard title={t('Definition of Ready')}>
        <span style={PRODUCT_MUTED_STYLE}>
          {t(
            'What an item needs before it goes into a sprint. The first five are checked from the item itself.',
          )}
        </span>
        {settings.readinessCriteria.map((criterion) => (
          <div
            key={criterion.id}
            style={{ alignItems: 'center', display: 'flex', gap: 6 }}
          >
            <ProductCommitTextInput
              ariaLabel={t('Criterion')}
              value={t(criterion.text)}
              isDisabled={isReadOnly}
              onCommit={(text) =>
                text.trim() !== '' &&
                update({
                  readinessCriteria: settings.readinessCriteria.map(
                    (candidate) =>
                      candidate.id === criterion.id
                        ? { ...candidate, text }
                        : candidate,
                  ),
                })
              }
            />
            {automaticIds.has(criterion.id) && (
              <span style={{ ...PRODUCT_MUTED_STYLE, whiteSpace: 'nowrap' }}>
                {t('automatic')}
              </span>
            )}
            {!isReadOnly && (
              <TaskIconButton
                label={t('Remove criterion')}
                onClick={() =>
                  update({
                    readinessCriteria: settings.readinessCriteria.filter(
                      (candidate) => candidate.id !== criterion.id,
                    ),
                  })
                }
              >
                <IconTrash size={14} />
              </TaskIconButton>
            )}
          </div>
        ))}
        {!isReadOnly && (
          <ProductCommitTextInput
            ariaLabel={t('New criterion')}
            value=""
            placeholder={t('+ Add a criterion (Enter)')}
            shouldClearOnCommit
            onCommit={(text) =>
              update({
                readinessCriteria: [
                  ...settings.readinessCriteria,
                  { id: createId('criterion'), text: text.trim() },
                ],
              })
            }
          />
        )}
      </ProductCard>

      <ProductCard title={t('Prioritization template')}>
        <span style={PRODUCT_MUTED_STYLE}>
          {t(
            'Decides the score shown in the backlog, Prioritize, Sprint Planning and the item. Scores given with another template are kept when switching.',
          )}
        </span>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ProductSectionLabel>{t('Template in use')}</ProductSectionLabel>
          <TaskBoardSelect
            ariaLabel={t('Template in use')}
            width={260}
            isDisabled={isReadOnly}
            value={template.id}
            options={PRIORITIZATION_TEMPLATES.map((candidate) => ({
              value: candidate.id,
              label: candidate.name,
            }))}
            onChange={(activeTemplateId) => update({ activeTemplateId })}
          />
        </label>
        <span style={PRODUCT_TEXT_STYLE}>{t(template.description)}</span>
        <code
          style={{
            ...PRODUCT_TEXT_STYLE,
            background: TASK_TOKENS.backgroundTertiary,
            borderRadius: TASK_TOKENS.radiusSmall,
            fontSize: 12,
            padding: '6px 8px',
          }}
        >
          {t(template.formula)}
        </code>
        <span style={PRODUCT_MUTED_STYLE}>
          {t('Source: {source}', { source: template.source })}
        </span>
        <div
          style={{
            alignItems: 'center',
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            gap: 8,
            paddingTop: 8,
          }}
        >
          <span style={{ ...PRODUCT_TEXT_STYLE, flex: 1, fontSize: 12 }}>
            {configSummary}
          </span>
          <TaskButton
            size="small"
            isDisabled={!hasConfig || isReadOnly}
            onClick={() => setIsConfiguring(true)}
          >
            <IconAdjustments size={14} />
            {t('Configure template')}
          </TaskButton>
        </div>
      </ProductCard>

      {data.canConfigureAccess && <ProductAccessSettings isMobile={isMobile} />}

      {isConfiguring && (
        <twenty-overlay>
          <TaskDialogFrame
            title={t('Configure template · {name}', { name: template.name })}
            onClose={() => setIsConfiguring(false)}
            footer={
              <TaskButton
                variant="primary"
                onClick={() => setIsConfiguring(false)}
              >
                {t('Done')}
              </TaskButton>
            }
          >
            {template.id === 'sae-ice-caf' && (
              <SaeIceCafConfig settings={settings} update={update} />
            )}
            {template.id === 'moscow' && (
              <MoscowConfig settings={settings} update={update} />
            )}
          </TaskDialogFrame>
        </twenty-overlay>
      )}
    </div>
  );
};

type ConfigProps = {
  settings: ProductBacklogSettings;
  update: SettingsUpdate;
};

const NumberRow = ({
  label,
  note,
  value,
  onChange,
}: {
  label: string;
  note?: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
    <span style={{ ...PRODUCT_TEXT_STYLE, flex: 1 }}>{label}</span>
    {note !== undefined && <span style={PRODUCT_MUTED_STYLE}>{note}</span>}
    <ProductCommitTextInput
      ariaLabel={label}
      type="number"
      width={90}
      value={String(value)}
      onCommit={(raw) => onChange(readNumber(raw, value))}
    />
  </div>
);

const SaeIceCafConfig = ({ settings, update }: ConfigProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ProductSectionLabel>{t('Competitors')}</ProductSectionLabel>
      {settings.competitors.map((competitor) => (
        <div
          key={competitor.id}
          style={{ alignItems: 'center', display: 'flex', gap: 6 }}
        >
          <ProductCommitTextInput
            ariaLabel={t('Competitor')}
            value={competitor.name}
            onCommit={(name) =>
              name.trim() !== '' &&
              update({
                competitors: settings.competitors.map((candidate) =>
                  candidate.id === competitor.id
                    ? { ...candidate, name }
                    : candidate,
                ),
              })
            }
          />
          <TaskBoardSelect
            ariaLabel={t('Type')}
            width={130}
            value={competitor.type}
            options={[
              { value: 'DIRECT', label: t('Direct') },
              { value: 'INDIRECT', label: t('Indirect') },
            ]}
            onChange={(type) =>
              update({
                competitors: settings.competitors.map((candidate) =>
                  candidate.id === competitor.id
                    ? { ...candidate, type: type as CompetitorType }
                    : candidate,
                ),
              })
            }
          />
          <TaskIconButton
            label={t('Remove competitor')}
            onClick={() =>
              update({
                competitors: settings.competitors.filter(
                  (candidate) => candidate.id !== competitor.id,
                ),
              })
            }
          >
            <IconTrash size={14} />
          </TaskIconButton>
        </div>
      ))}
      <div>
        <TaskButton
          size="small"
          variant="ghost"
          onClick={() =>
            update({
              competitors: [
                ...settings.competitors,
                {
                  id: createId('competitor'),
                  name: t('New competitor'),
                  type: 'DIRECT',
                },
              ],
            })
          }
        >
          <IconPlus size={14} />
          {t('Add competitor')}
        </TaskButton>
      </div>
    </section>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ProductSectionLabel>{t('Competitor type weight')}</ProductSectionLabel>
      <NumberRow
        label={t('Direct')}
        value={settings.competitorWeights.DIRECT}
        onChange={(DIRECT) =>
          update({
            competitorWeights: { ...settings.competitorWeights, DIRECT },
          })
        }
      />
      <NumberRow
        label={t('Indirect')}
        value={settings.competitorWeights.INDIRECT}
        onChange={(INDIRECT) =>
          update({
            competitorWeights: { ...settings.competitorWeights, INDIRECT },
          })
        }
      />
    </section>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ProductSectionLabel>{t('Adoption scores')}</ProductSectionLabel>
      {(Object.keys(COMPETITOR_ADOPTION_LABELS) as CompetitorAdoption[]).map(
        (adoption) => (
          <NumberRow
            key={adoption}
            label={t(COMPETITOR_ADOPTION_LABELS[adoption])}
            value={settings.adoptionScores[adoption]}
            onChange={(score) =>
              update({
                adoptionScores: {
                  ...settings.adoptionScores,
                  [adoption]: score,
                },
              })
            }
          />
        ),
      )}
    </section>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ProductSectionLabel>
        {t('Implementation phase thresholds (final score)')}
      </ProductSectionLabel>
      <NumberRow
        label={t('Phase 1 · High')}
        note={t('above')}
        value={settings.phaseThresholds.phaseOne}
        onChange={(phaseOne) =>
          update({ phaseThresholds: { ...settings.phaseThresholds, phaseOne } })
        }
      />
      <NumberRow
        label={t('Phase 2 · Medium')}
        note={t('from')}
        value={settings.phaseThresholds.phaseTwo}
        onChange={(phaseTwo) =>
          update({ phaseThresholds: { ...settings.phaseThresholds, phaseTwo } })
        }
      />
      <NumberRow
        label={t('Phase 3 · Low')}
        note={t('from')}
        value={settings.phaseThresholds.phaseThree}
        onChange={(phaseThree) =>
          update({
            phaseThresholds: { ...settings.phaseThresholds, phaseThree },
          })
        }
      />
      <span style={PRODUCT_MUTED_STYLE}>
        {t('Phase 4 · Niche: below {threshold}', {
          threshold: settings.phaseThresholds.phaseThree,
        })}
      </span>
    </section>
  </div>
);

const MoscowConfig = ({ settings, update }: ConfigProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ProductSectionLabel>{t('Points per vote')}</ProductSectionLabel>
      {(Object.keys(MOSCOW_BUCKETS) as MoscowBucket[]).map((bucket) => (
        <NumberRow
          key={bucket}
          label={`${bucket} · ${t(MOSCOW_BUCKETS[bucket].label)}`}
          value={settings.moscowPoints[bucket]}
          onChange={(points) =>
            update({
              moscowPoints: { ...settings.moscowPoints, [bucket]: points },
            })
          }
        />
      ))}
    </section>
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <ProductSectionLabel>{t('Voting stakeholders')}</ProductSectionLabel>
      {settings.stakeholders.map((stakeholder) => (
        <div
          key={stakeholder.id}
          style={{ alignItems: 'center', display: 'flex', gap: 6 }}
        >
          <ProductCommitTextInput
            ariaLabel={t('Stakeholder')}
            value={t(stakeholder.name)}
            onCommit={(name) =>
              name.trim() !== '' &&
              update({
                stakeholders: settings.stakeholders.map((candidate) =>
                  candidate.id === stakeholder.id
                    ? { ...candidate, name }
                    : candidate,
                ),
              })
            }
          />
          <TaskIconButton
            label={t('Remove stakeholder')}
            onClick={() =>
              update({
                stakeholders: settings.stakeholders.filter(
                  (candidate) => candidate.id !== stakeholder.id,
                ),
              })
            }
          >
            <IconTrash size={14} />
          </TaskIconButton>
        </div>
      ))}
      <div>
        <TaskButton
          size="small"
          variant="ghost"
          onClick={() =>
            update({
              stakeholders: [
                ...settings.stakeholders,
                { id: createId('stakeholder'), name: t('Stakeholder') },
              ],
            })
          }
        >
          <IconPlus size={14} />
          {t('Add stakeholder')}
        </TaskButton>
      </div>
    </section>
  </div>
);
