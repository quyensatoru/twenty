import { type CSSProperties, type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import {
  type SortDirection,
  type SortState,
} from '../../utils/sort-records.util';
import { BC_TOKENS, spacing } from './bc-theme';

// Mirrors Twenty's record table: light cell borders, tertiary header text
// without uppercase, sticky header row.
export const HEADER_CELL_STYLE: CSSProperties = {
  background: BC_TOKENS.background,
  borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
  borderRight: `1px solid ${BC_TOKENS.borderLight}`,
  color: BC_TOKENS.textTertiary,
  fontSize: BC_TOKENS.fontSizeMd,
  fontWeight: BC_TOKENS.fontWeightMedium,
  height: 32,
  padding: `0 ${spacing(2)}`,
  position: 'sticky',
  textAlign: 'left',
  top: 0,
  whiteSpace: 'nowrap',
  zIndex: 1,
};

export const CELL_STYLE: CSSProperties = {
  borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
  borderRight: `1px solid ${BC_TOKENS.borderLight}`,
  fontSize: BC_TOKENS.fontSizeMd,
  height: 32,
  padding: `${spacing(1)} ${spacing(2)}`,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

export const TABLE_STYLE: CSSProperties = {
  borderCollapse: 'separate',
  borderSpacing: 0,
  width: '100%',
};

// Click cycles ascending, descending, then back to the default order.
export const cycleSort = (current: SortState, key: string): SortState => {
  if (current === null || current.key !== key) {
    return { key, direction: 'ASC' };
  }

  return current.direction === 'ASC' ? { key, direction: 'DESC' } : null;
};

const readAriaSort = (
  sort: SortState,
  key: string,
): 'ascending' | 'descending' | 'none' => {
  if (sort === null || sort.key !== key) {
    return 'none';
  }

  return sort.direction === 'ASC' ? 'ascending' : 'descending';
};

const SortIcon = ({ direction }: { direction: SortDirection | null }) => {
  if (direction === 'ASC') {
    return <IconArrowUp size={12} />;
  }

  if (direction === 'DESC') {
    return <IconArrowDown size={12} />;
  }

  return <IconArrowsSort size={12} color={BC_TOKENS.textLight} />;
};

// `defaultSort` is the order the server applies when nothing is chosen; its
// column shows the arrow too, so the current order is always visible.
export const SortableHeaderCell = ({
  label,
  sortKey,
  sort,
  defaultSort = null,
  onSortChange,
  style,
  align = 'left',
}: {
  label: string;
  sortKey?: string;
  sort: SortState;
  defaultSort?: SortState;
  onSortChange: (sort: SortState) => void;
  style?: CSSProperties;
  align?: 'left' | 'right';
}) => {
  if (sortKey === undefined) {
    return <th style={{ ...HEADER_CELL_STYLE, textAlign: align, ...style }}>{label}</th>;
  }

  const effectiveSort = sort ?? defaultSort;
  const direction =
    effectiveSort !== null && effectiveSort.key === sortKey ? effectiveSort.direction : null;

  return (
    <th
      aria-sort={readAriaSort(effectiveSort, sortKey)}
      style={{ ...HEADER_CELL_STYLE, padding: 0, textAlign: align, ...style }}
    >
      <button
        type="button"
        onClick={() => onSortChange(cycleSort(sort, sortKey))}
        title={t('Sort by {column}', { column: label })}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          color: direction === null ? BC_TOKENS.textTertiary : BC_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: BC_TOKENS.fontFamily,
          fontSize: BC_TOKENS.fontSizeMd,
          fontWeight: BC_TOKENS.fontWeightMedium,
          gap: spacing(1),
          height: 32,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          padding: `0 ${spacing(2)}`,
          width: '100%',
        }}
      >
        <span>{label}</span>
        <SortIcon direction={direction} />
      </button>
    </th>
  );
};

export const HoverRow = ({
  isSelected = false,
  onClick,
  children,
}: {
  isSelected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isSelected
          ? BC_TOKENS.backgroundSelected
          : isHovered && onClick !== undefined
            ? BC_TOKENS.backgroundHover
            : 'transparent',
        cursor: onClick === undefined ? 'default' : 'pointer',
      }}
    >
      {children}
    </tr>
  );
};

export const TablePagination = ({
  page,
  pageCount,
  total,
  summary,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  summary?: string;
  onPageChange: (page: number) => void;
}) => (
  <div
    style={{
      alignItems: 'center',
      borderTop: `1px solid ${BC_TOKENS.borderLight}`,
      color: BC_TOKENS.textTertiary,
      display: 'flex',
      flexShrink: 0,
      fontSize: BC_TOKENS.fontSizeSm,
      gap: spacing(2),
      justifyContent: 'space-between',
      minHeight: 36,
      padding: `0 ${spacing(3)}`,
    }}
  >
    <span>{summary ?? t('{count} results', { count: total })}</span>
    {pageCount > 1 && (
      <span style={{ alignItems: 'center', display: 'flex', gap: spacing(1) }}>
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label={t('Previous page')}
          disabled={page <= 1}
          startIcon={<IconChevronLeft size={14} />}
          onClick={() => onPageChange(page - 1)}
        />
        <span>{t('Page {page} of {count}', { page, count: pageCount })}</span>
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          aria-label={t('Next page')}
          disabled={page >= pageCount}
          startIcon={<IconChevronRight size={14} />}
          onClick={() => onPageChange(page + 1)}
        />
      </span>
    )}
  </div>
);

// A click on a control inside a clickable row must not also open the row.
export const stopRowClick = (event: { stopPropagation: () => void }) => {
  event.stopPropagation();
};
