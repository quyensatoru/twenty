import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { SPLIT_ITEM_ROUTE_PATH } from '../../../constants/product-backlog';
import { type ProductItem } from '../../../types/product-backlog';
import { TaskButton } from '../../components/task-button';
import { TaskDialogFrame } from '../../components/task-dialog-frame';
import { getTaskControlStyle } from '../../components/task-control-styles';
import { postAppRoute } from '../../utils/post-app-route.util';
import { readErrorText } from '../../utils/read-error-text.util';
import {
  PRODUCT_MUTED_STYLE,
  PRODUCT_TEXT_STYLE,
  ProductCheckRow,
} from './product-ui';

type ProductSplitDialogProps = {
  item: ProductItem;
  onClose: () => void;
  onSplit: () => void;
};

export const ProductSplitDialog = ({
  item,
  onClose,
  onSplit,
}: ProductSplitDialogProps) => {
  const [text, setText] = useState('');
  const [shouldConvertToEpic, setShouldConvertToEpic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const titles = text
    .split('\n')
    .map((title) => title.trim())
    .filter((title) => title !== '');

  const split = async () => {
    setIsSaving(true);

    try {
      await postAppRoute(SPLIT_ITEM_ROUTE_PATH, {
        issueId: item.id,
        titles,
        shouldConvertToEpic,
      });
      onSplit();
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <TaskDialogFrame
      title={t('Split {key}', { key: item.issueKey ?? '' })}
      onClose={onClose}
      footer={
        <>
          <TaskButton variant="ghost" onClick={onClose}>
            {t('Cancel')}
          </TaskButton>
          <TaskButton
            variant="primary"
            isDisabled={titles.length === 0 || isSaving}
            onClick={() => void split()}
          >
            {t('Split into {count} stories', { count: titles.length })}
          </TaskButton>
        </>
      }
    >
      <span style={PRODUCT_MUTED_STYLE}>
        {t(
          'One story per line, most valuable for the customer first. Each keeps the epic, goal and labels.',
        )}
      </span>
      <textarea
        aria-label={t('Story titles')}
        value={text}
        rows={6}
        onChange={(event) => setText(event.target.value)}
        style={{
          ...getTaskControlStyle(false),
          ...PRODUCT_TEXT_STYLE,
          boxSizing: 'border-box',
          minHeight: 120,
          padding: 8,
          resize: 'vertical',
          width: '100%',
        }}
      />
      <ProductCheckRow
        label={t(
          'Too big for a story: turn it into a new epic and archive the original',
        )}
        isChecked={shouldConvertToEpic}
        onToggle={() => setShouldConvertToEpic(!shouldConvertToEpic)}
      />
    </TaskDialogFrame>
  );
};
