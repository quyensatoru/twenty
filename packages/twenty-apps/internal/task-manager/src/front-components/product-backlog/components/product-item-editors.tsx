import { t } from 'twenty-sdk/front-component';
import { IconTrash } from 'twenty-ui/icon';

import {
  MAX_SPRINT_ITEM_POINTS,
  STORY_POINT_SCALE,
} from '../../../constants/product-backlog';
import {
  type AcceptanceCriterion,
  type UserStory,
} from '../../../types/product-backlog';
import { type ItemReadiness } from '../../../utils/product-backlog/item-readiness.util';
import { TaskIconButton } from '../../components/task-icon-button';
import { TASK_TOKENS } from '../../components/task-tokens';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCheckRow,
  ProductCommitTextInput,
  ProductWarning,
} from './product-ui';

const EMPTY_USER_STORY: UserStory = { asA: '', iWant: '', soThat: '' };

type UserStoryEditorProps = {
  userStory: UserStory | null | undefined;
  onChange: (userStory: UserStory) => void;
  isReadOnly: boolean;
};

export const UserStoryEditor = ({
  userStory,
  onChange,
  isReadOnly,
}: UserStoryEditorProps) => {
  const story = { ...EMPTY_USER_STORY, ...(userStory ?? {}) };
  const rows = [
    {
      key: 'asA' as const,
      label: t('As a'),
      placeholder: t('kind of merchant or user'),
    },
    { key: 'iWant' as const, label: t('I want'), placeholder: t('the goal') },
    {
      key: 'soThat' as const,
      label: t('So that'),
      placeholder: t('the value it brings'),
    },
  ];

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'grid',
        gap: 6,
        gridTemplateColumns: '64px minmax(0, 1fr)',
      }}
    >
      {rows.map((row) => (
        <div key={row.key} style={{ display: 'contents' }}>
          <span style={{ ...PRODUCT_MUTED_STYLE, fontWeight: 600 }}>
            {row.label}
          </span>
          <ProductCommitTextInput
            ariaLabel={row.label}
            value={story[row.key]}
            placeholder={row.placeholder}
            isDisabled={isReadOnly}
            onCommit={(value) => onChange({ ...story, [row.key]: value })}
          />
        </div>
      ))}
    </div>
  );
};

type AcceptanceCriteriaEditorProps = {
  criteria: AcceptanceCriterion[] | null | undefined;
  onChange: (criteria: AcceptanceCriterion[]) => void;
  isReadOnly: boolean;
};

export const AcceptanceCriteriaEditor = ({
  criteria,
  onChange,
  isReadOnly,
}: AcceptanceCriteriaEditorProps) => {
  const list = criteria ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {list.map((criterion) => (
        <ProductCheckRow
          key={criterion.id}
          label={criterion.text}
          isChecked={criterion.isDone}
          onToggle={
            isReadOnly
              ? undefined
              : () =>
                  onChange(
                    list.map((candidate) =>
                      candidate.id === criterion.id
                        ? { ...candidate, isDone: !candidate.isDone }
                        : candidate,
                    ),
                  )
          }
          trailing={
            isReadOnly ? undefined : (
              <TaskIconButton
                label={t('Remove criterion')}
                onClick={() =>
                  onChange(
                    list.filter((candidate) => candidate.id !== criterion.id),
                  )
                }
              >
                <IconTrash size={13} />
              </TaskIconButton>
            )
          }
        />
      ))}
      {list.length === 0 && isReadOnly && (
        <span style={PRODUCT_MUTED_STYLE}>
          {t('No acceptance criteria yet.')}
        </span>
      )}
      {!isReadOnly && (
        <ProductCommitTextInput
          ariaLabel={t('New acceptance criterion')}
          value=""
          placeholder={t('Given … When … Then … (Enter to add)')}
          shouldClearOnCommit
          onCommit={(text) =>
            onChange([
              ...list,
              {
                id: `criterion-${Date.now()}`,
                text: text.trim(),
                isDone: false,
              },
            ])
          }
        />
      )}
    </div>
  );
};

type StoryPointPickerProps = {
  value: number | null | undefined;
  onChange: (points: number | null) => void;
  isReadOnly: boolean;
};

export const StoryPointPicker = ({
  value,
  onChange,
  isReadOnly,
}: StoryPointPickerProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {STORY_POINT_SCALE.map((points) => {
        const isSelected = value === points;

        return (
          <button
            key={points}
            type="button"
            disabled={isReadOnly}
            onClick={() => onChange(isSelected ? null : points)}
            style={{
              ...PRODUCT_TEXT_STYLE,
              background: isSelected
                ? TASK_TOKENS.accent
                : TASK_TOKENS.background,
              border: `1px solid ${isSelected ? TASK_TOKENS.accent : TASK_TOKENS.border}`,
              borderRadius: TASK_TOKENS.radiusSmall,
              color: isSelected
                ? TASK_TOKENS.textInverted
                : TASK_TOKENS.textPrimary,
              cursor: isReadOnly ? 'default' : 'pointer',
              fontVariantNumeric: 'tabular-nums',
              height: 28,
              minWidth: 32,
            }}
          >
            {points}
          </button>
        );
      })}
    </div>
    {(value ?? 0) > MAX_SPRINT_ITEM_POINTS && (
      <ProductWarning>
        {t('Larger than {points} pt: split it before it goes into a sprint.', {
          points: MAX_SPRINT_ITEM_POINTS,
        })}
      </ProductWarning>
    )}
  </div>
);

type ReadinessChecklistProps = {
  readiness: ItemReadiness;
  onToggle: (criterionId: string, isMet: boolean) => void;
  isReadOnly: boolean;
};

export const ReadinessChecklist = ({
  readiness,
  onToggle,
  isReadOnly,
}: ReadinessChecklistProps) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {readiness.checks.map((check) => (
      <ProductCheckRow
        key={check.id}
        label={t(check.text)}
        isChecked={check.isMet}
        isAutomatic={check.isAutomatic}
        onToggle={
          isReadOnly ? undefined : () => onToggle(check.id, !check.isMet)
        }
      />
    ))}
  </div>
);
