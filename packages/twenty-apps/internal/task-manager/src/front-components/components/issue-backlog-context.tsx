import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconChevronDown,
  IconChevronRight,
  IconListDetails,
  IconPlus,
} from 'twenty-ui/icon';

import { type ProductItem } from '../../types/product-backlog';
import {
  AcceptanceCriteriaEditor,
  UserStoryEditor,
} from '../product-backlog/components/product-item-editors';
import {
  ProductCommitTextInput,
  ProductSectionLabel,
  ProductTextArea,
} from '../product-backlog/components/product-ui';
import { TaskButton } from './task-button';
import {
  TASK_DETAIL_BLOCK_FRAME_STYLE,
  TASK_DETAIL_BLOCK_INSET,
} from './task-control-styles';
import { readTagColor, TASK_TOKENS } from './task-tokens';

type BacklogContextField =
  'userStory' | 'acceptanceCriteria' | 'whyNow' | 'successMetric';

const FIELD_ORDER: readonly BacklogContextField[] = [
  'userStory',
  'acceptanceCriteria',
  'whyNow',
  'successMetric',
];

const isFilled = (value: string | null | undefined) =>
  typeof value === 'string' && value.trim() !== '';

const readFilledFields = (item: ProductItem): BacklogContextField[] =>
  FIELD_ORDER.filter((field) => {
    switch (field) {
      case 'userStory':
        return (
          isFilled(item.userStory?.asA) ||
          isFilled(item.userStory?.iWant) ||
          isFilled(item.userStory?.soThat)
        );
      case 'acceptanceCriteria':
        return (item.acceptanceCriteria?.length ?? 0) > 0;
      case 'whyNow':
        return isFilled(item.whyNow);
      case 'successMetric':
        return isFilled(item.successMetric);
    }
  });

const readFieldLabel = (field: BacklogContextField) => {
  switch (field) {
    case 'userStory':
      return t('User story');
    case 'acceptanceCriteria':
      return t('Acceptance criteria');
    case 'whyNow':
      return t('Why now');
    case 'successMetric':
      return t('Success metric');
  }
};

type IssueBacklogContextProps = {
  item: ProductItem;
  isReadOnly: boolean;
  onUpdate: (patch: Partial<ProductItem>) => void;
};

// What the PM wrote on the item, carried onto the issue it became and still
// editable there. Kept out of the description, which is the developers'.
// Mount it per issue: the fields shown are fixed when it opens, so emptying
// one while editing does not fold it away under the cursor.
export const IssueBacklogContext = ({
  item,
  isReadOnly,
  onUpdate,
}: IssueBacklogContextProps) => {
  const [fields, setFields] = useState<BacklogContextField[]>(() =>
    readFilledFields(item),
  );
  const [isExpanded, setIsExpanded] = useState(true);

  if (fields.length === 0) {
    return null;
  }

  const criteria = item.acceptanceCriteria ?? [];
  const missingFields = FIELD_ORDER.filter((field) => !fields.includes(field));

  return (
    <section
      style={{
        ...TASK_DETAIL_BLOCK_FRAME_STYLE,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: TASK_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: TASK_TOKENS.fontFamily,
          fontSize: 13,
          fontWeight: 600,
          gap: 6,
          minHeight: 36,
          padding: `0 ${TASK_DETAIL_BLOCK_INSET}px`,
          textAlign: 'left',
        }}
      >
        {isExpanded ? (
          <IconChevronDown size={14} />
        ) : (
          <IconChevronRight size={14} />
        )}
        <IconListDetails size={14} color={readTagColor('blue').text} />
        {t('From Product Backlog')}
      </button>
      {isExpanded && (
        <div
          style={{
            borderTop: `1px solid ${TASK_TOKENS.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: `12px ${TASK_DETAIL_BLOCK_INSET}px 14px`,
          }}
        >
          {fields.includes('userStory') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ProductSectionLabel>{t('User story')}</ProductSectionLabel>
              <UserStoryEditor
                userStory={item.userStory}
                isReadOnly={isReadOnly}
                onChange={(userStory) => onUpdate({ userStory })}
              />
            </div>
          )}
          {fields.includes('acceptanceCriteria') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ProductSectionLabel>
                {t('Acceptance criteria ({done}/{total})', {
                  done: criteria.filter((criterion) => criterion.isDone).length,
                  total: criteria.length,
                })}
              </ProductSectionLabel>
              <AcceptanceCriteriaEditor
                criteria={criteria}
                isReadOnly={isReadOnly}
                isTextEditable
                onChange={(acceptanceCriteria) =>
                  onUpdate({ acceptanceCriteria })
                }
              />
            </div>
          )}
          {fields.includes('whyNow') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ProductSectionLabel>{t('Why now')}</ProductSectionLabel>
              <ProductTextArea
                ariaLabel={t('Why now')}
                value={item.whyNow ?? ''}
                isDisabled={isReadOnly}
                placeholder={t(
                  'Why does this matter, and why now? Customer quotes, data…',
                )}
                onCommit={(whyNow) => onUpdate({ whyNow })}
              />
            </div>
          )}
          {fields.includes('successMetric') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ProductSectionLabel>{t('Success metric')}</ProductSectionLabel>
              <ProductCommitTextInput
                ariaLabel={t('Success metric')}
                value={item.successMetric ?? ''}
                isDisabled={isReadOnly}
                placeholder={t(
                  'A yes/no goal, a number to move, a behaviour to watch',
                )}
                onCommit={(successMetric) => onUpdate({ successMetric })}
              />
            </div>
          )}
          {!isReadOnly && missingFields.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {missingFields.map((field) => (
                <TaskButton
                  key={field}
                  size="small"
                  variant="ghost"
                  onClick={() =>
                    setFields(
                      FIELD_ORDER.filter(
                        (candidate) =>
                          candidate === field || fields.includes(candidate),
                      ),
                    )
                  }
                >
                  <IconPlus size={13} />
                  {readFieldLabel(field)}
                </TaskButton>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
