import { useMemo, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  t,
} from 'twenty-sdk/front-component';
import {
  IconInbox,
  IconChartBar,
  IconCheckbox,
  IconFlag,
  IconListDetails,
  IconListNumbers,
  IconPlus,
  IconCalendarRepeat,
  IconSearch,
  IconSettings,
  IconStack2,
  IconUserCircle,
} from 'twenty-ui/icon';

import { ISSUE_PRIORITY_OPTIONS } from '../constants/issue-priority-options';
import { ISSUE_TYPE_OPTIONS } from '../constants/issue-type-options';
import { PRODUCT_BACKLOG_FRONT_COMPONENT_UID } from '../constants/product-backlog';
import { type ProductItem } from '../types/product-backlog';
import { type PageInset } from '../types/task-board';
import { readEpicColor } from '../utils/epic-color.util';
import { type BacklogHealthFilterId } from '../utils/product-backlog/backlog-health.util';
import { TaskAvatar } from './components/task-avatar';
import { IssueTypeGlyph, UnassignedAvatar } from './components/task-board-card';
import { TaskBoardDetail } from './components/task-board-detail';
import { TaskBoardSelect } from './components/task-board-select';
import { TaskBacklogSkeleton } from './components/task-board-skeleton';
import { TaskButton } from './components/task-button';
import { TaskColorDot, TaskFilterChip } from './components/task-chip';
import {
  TaskFilterMenu,
  type TaskFilterMenuField,
} from './components/task-filter-menu';
import { TaskMessage } from './components/task-message';
import { TaskPriorityGlyph } from './components/task-priority-glyph';
import { TaskTextInput } from './components/task-text-input';
import { readTagColor, TASK_TOKENS } from './components/task-tokens';
import { TaskProjectBadge } from './components/task-toolbar';
import { useIsMobile } from './hooks/use-is-mobile';
import { ProductIdeasView } from './product-backlog/components/product-ideas-view';
import { ProductInsightsView } from './product-backlog/components/product-insights-view';
import { ProductListView } from './product-backlog/components/product-list-view';
import { ProductPrioritizationView } from './product-backlog/components/product-prioritization-view';
import { ProductSettingsView } from './product-backlog/components/product-settings-view';
import { ProductSprintPlanningView } from './product-backlog/components/product-sprint-planning-view';
import { useProductBacklog } from './product-backlog/hooks/use-product-backlog';
import { useProductBacklogModel } from './product-backlog/hooks/use-product-backlog-model';
import {
  type ProductBacklogTab,
  PRODUCT_BACKLOG_TABS,
} from './product-backlog/utils/product-backlog-tabs.util';
import { readMemberName } from './utils/read-member-name.util';
import { useBoardIssueSelection } from './hooks/use-board-issue-selection';
import { useHostLocationHash, useHostLocationPathname } from './hooks/use-host-location';

const PROJECT_STORAGE_KEY = 'product-backlog.project-id';
const BOARD_PROJECT_STORAGE_KEY = 'task-board.project-id';
const TAB_STORAGE_KEY = 'product-backlog.tab';
const UNASSIGNED_VALUE = 'UNASSIGNED';
const NO_EPIC_VALUE = 'NO_EPIC';
const ALL_VALUE = 'ALL';

const readStoredValue = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key);

    return value === null || value === '' ? null : value;
  } catch {
    return null;
  }
};

const storeValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // A convenience only: the page still opens, on its defaults.
  }
};

const readTab = (value: string | null): ProductBacklogTab | null =>
  PRODUCT_BACKLOG_TABS.find((tab) => tab === value) ?? null;

const TAB_ICONS = {
  list: IconListDetails,
  prioritize: IconListNumbers,
  sprint: IconCalendarRepeat,
  ideas: IconInbox,
  insights: IconChartBar,
  settings: IconSettings,
} as const;

// The Product Backlog: Ideas become items, items are scored, refined and
// planned into sprints, and only then reach the Board as issues. One project
// at a time, like the Board, with the issue modal shared with it.
const ProductBacklog = () => {
  const locationHash = useHostLocationHash();
  const hostPathname = useHostLocationPathname();
  const pagePath = hostPathname === '' ? null : hostPathname;
  const isMobile = useIsMobile();
  const [projectId, setProjectId] = useState<string | null>(
    () =>
      readStoredValue(PROJECT_STORAGE_KEY) ??
      readStoredValue(BOARD_PROJECT_STORAGE_KEY),
  );
  const [tab, setTab] = useState<ProductBacklogTab>(
    () =>
      readTab(locationHash.replace(/^#/, '')) ??
      readTab(readStoredValue(TAB_STORAGE_KEY)) ??
      'list',
  );
  const [search, setSearch] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState(ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState(ALL_VALUE);
  const [epicFilter, setEpicFilter] = useState<string | null | undefined>(
    undefined,
  );
  const [healthFilterId, setHealthFilterId] =
    useState<BacklogHealthFilterId | null>(null);
  const { selectedIssueId, selectIssue: setSelectedIssueId } =
    useBoardIssueSelection();
  const [plannedSprintId, setPlannedSprintId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const { data, loadError, isLoading, reload, actions } =
    useProductBacklog(projectId);
  const model = useProductBacklogModel(data);

  const changeTab = (nextTab: ProductBacklogTab) => {
    setTab(nextTab);
    storeValue(TAB_STORAGE_KEY, nextTab);
  };

  const matchesFilters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (item: ProductItem) => {
      if (
        query !== '' &&
        !(item.title ?? '').toLowerCase().includes(query) &&
        !(item.issueKey ?? '').toLowerCase().includes(query)
      ) {
        return false;
      }

      if (
        assigneeIds.length > 0 &&
        !assigneeIds.includes(item.assigneeId ?? UNASSIGNED_VALUE)
      ) {
        return false;
      }

      if (priorityFilter !== ALL_VALUE && item.priority !== priorityFilter) {
        return false;
      }

      if (typeFilter !== ALL_VALUE && item.issueType !== typeFilter) {
        return false;
      }

      return epicFilter === undefined || (item.epicId ?? null) === epicFilter;
    };
  }, [search, assigneeIds, priorityFilter, typeFilter, epicFilter]);

  const inset: PageInset = isMobile
    ? { left: 12, right: 12 }
    : { left: 12, right: 20 };

  if (isLoading && data === null) {
    return (
      <ProductBacklogFrame>
        <TaskBacklogSkeleton inset={inset} />
      </ProductBacklogFrame>
    );
  }

  if (data === null || model === null) {
    return (
      <ProductBacklogFrame>
        <TaskMessage
          text={loadError ?? t('The Product Backlog is not available.')}
          tone="danger"
        />
      </ProductBacklogFrame>
    );
  }

  if (data.access === 'NONE') {
    return (
      <ProductBacklogFrame>
        <TaskMessage
          text={t(
            'Your role does not have access to the Product Backlog. Ask an admin if you need it.',
          )}
        />
      </ProductBacklogFrame>
    );
  }

  if (data.activeProjectId === null) {
    return (
      <ProductBacklogFrame>
        <TaskMessage
          text={t(
            'No project is available to you yet. Ask for access to a Shopify app first.',
          )}
        />
      </ProductBacklogFrame>
    );
  }

  const activeProject = data.projects.find(
    (project) => project.id === data.activeProjectId,
  );
  const inboxIdeaCount = data.ideas.filter(
    (idea) => (idea.status ?? 'INBOX') === 'INBOX',
  ).length;
  const tabLabels: Record<ProductBacklogTab, string> = {
    list: t('Item list'),
    prioritize: t('Prioritize'),
    sprint: t('Sprint Planning'),
    ideas: t('Ideas'),
    insights: t('Insights'),
    settings: t('Settings'),
  };
  const hasFilterBar = tab === 'list' || tab === 'prioritize';
  const assignableById = new Map(
    data.assignableMembers.map((member) => [member.id, member]),
  );
  const assigneeOptions = [
    ...data.assignableMembers
      .map((member) => ({
        value: member.id,
        label: readMemberName(assignableById, member.id, t('Unknown')),
        icon: (
          <TaskAvatar
            name={readMemberName(assignableById, member.id, '')}
            avatarUrl={member.avatarUrl}
            size={18}
            shouldShowTitle={false}
          />
        ),
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    {
      value: UNASSIGNED_VALUE,
      label: t('Unassigned'),
      icon: <UnassignedAvatar size={18} />,
    },
  ];
  const toggleSingle =
    (current: string, setValue: (value: string) => void) => (value: string) =>
      setValue(current === value ? ALL_VALUE : value);
  const filterFields: TaskFilterMenuField[] = [
    {
      key: 'assignee',
      label: t('Assignee'),
      icon: <IconUserCircle size={14} />,
      isMulti: true,
      selectedValues: assigneeIds,
      options: assigneeOptions,
      onToggle: (value) =>
        setAssigneeIds((current) =>
          current.includes(value)
            ? current.filter((id) => id !== value)
            : [...current, value],
        ),
    },
    {
      key: 'priority',
      label: t('Priority'),
      icon: <IconFlag size={14} />,
      isMulti: false,
      selectedValues: priorityFilter === ALL_VALUE ? [] : [priorityFilter],
      options: [...ISSUE_PRIORITY_OPTIONS].reverse().map((option) => ({
        value: option.value,
        label: t(option.label),
        icon: <TaskPriorityGlyph priority={option.value} />,
      })),
      onToggle: toggleSingle(priorityFilter, setPriorityFilter),
    },
    {
      key: 'type',
      label: t('Type'),
      icon: <IconCheckbox size={14} />,
      isMulti: false,
      selectedValues: typeFilter === ALL_VALUE ? [] : [typeFilter],
      options: ISSUE_TYPE_OPTIONS.filter(
        (option) => option.value !== 'SUBTASK',
      ).map((option) => ({
        value: option.value,
        label: t(option.label),
        icon: <IssueTypeGlyph issueType={option.value} />,
      })),
      onToggle: toggleSingle(typeFilter, setTypeFilter),
    },
    {
      key: 'epic',
      label: t('Epic'),
      icon: <IconStack2 size={14} />,
      isMulti: false,
      selectedValues:
        epicFilter === undefined
          ? []
          : [epicFilter === null ? NO_EPIC_VALUE : epicFilter],
      options: [
        { value: NO_EPIC_VALUE, label: t('No epic') },
        ...data.epics.map((epic) => ({
          value: epic.id,
          label: epic.name ?? t('Untitled epic'),
          icon: <TaskColorDot color={readTagColor(readEpicColor(epic)).text} />,
        })),
      ],
      onToggle: (value) => {
        const next = value === NO_EPIC_VALUE ? null : value;

        setEpicFilter(epicFilter === next ? undefined : next);
      },
    },
  ];
  const selectedAssigneeNames = assigneeIds.map(
    (id) =>
      assigneeOptions.find((option) => option.value === id)?.label ??
      t('Unknown'),
  );
  const isFiltered =
    search.trim() !== '' ||
    assigneeIds.length > 0 ||
    priorityFilter !== ALL_VALUE ||
    typeFilter !== ALL_VALUE ||
    epicFilter !== undefined;
  const clearFilters = () => {
    setSearch('');
    setAssigneeIds([]);
    setPriorityFilter(ALL_VALUE);
    setTypeFilter(ALL_VALUE);
    setEpicFilter(undefined);
  };
  const navIssueIds = data.items.filter(matchesFilters).map((item) => item.id);
  const commonProps = {
    data,
    model,
    actions,
    reload,
    inset,
    isMobile,
    onOpenItem: setSelectedIssueId,
  };

  return (
    <ProductBacklogFrame>
      <header
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: 8,
          minHeight: 48,
          padding: `6px ${inset.right}px 6px ${inset.left}px`,
        }}
      >
        <TaskBoardSelect
          ariaLabel={t('Project')}
          variant="ghost"
          width="auto"
          value={data.activeProjectId}
          triggerIcon={
            <TaskProjectBadge projectKey={activeProject?.key ?? null} />
          }
          options={data.projects.map((project) => ({
            value: project.id,
            label: project.name ?? project.key ?? project.id,
            icon: (
              <TaskProjectBadge projectKey={project.key ?? null} size={18} />
            ),
          }))}
          onChange={(value) => {
            setProjectId(value);
            storeValue(PROJECT_STORAGE_KEY, value);
            setSelectedIssueId(null);
            setPlannedSprintId(null);
            setHealthFilterId(null);
            clearFilters();
          }}
        />
        <span style={{ flex: 1 }} />
        {hasFilterBar && (
          <div
            style={{
              display: 'flex',
              flex: isMobile ? '1 1 100%' : '0 1 360px',
              order: isMobile ? 3 : 0,
            }}
          >
            <TaskTextInput
              value={search}
              onChange={setSearch}
              ariaLabel={t('Search items')}
              placeholder={t('Search items by key or title…')}
              prefixIcon={
                <IconSearch size={14} color={TASK_TOKENS.textTertiary} />
              }
              height={30}
            />
          </div>
        )}
        {data.canWrite && (
          <TaskButton
            variant="primary"
            size="compact"
            title={t('New item')}
            onClick={() => {
              changeTab('list');
              setIsComposerOpen(true);
            }}
          >
            <IconPlus size={14} />
            {!isMobile && t('New item')}
          </TaskButton>
        )}
      </header>

      <nav
        role="tablist"
        style={{
          alignItems: 'center',
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          display: 'flex',
          flexShrink: 0,
          gap: 2,
          overflowX: 'auto',
          padding: `0 ${inset.right}px 0 ${inset.left}px`,
        }}
      >
        {PRODUCT_BACKLOG_TABS.map((tabKey) => {
          const Icon = TAB_ICONS[tabKey];
          const isActive = tab === tabKey;

          return (
            <button
              key={tabKey}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => changeTab(tabKey)}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${isActive ? TASK_TOKENS.textPrimary : 'transparent'}`,
                color: isActive
                  ? TASK_TOKENS.textPrimary
                  : TASK_TOKENS.textTertiary,
                cursor: 'pointer',
                display: 'inline-flex',
                flexShrink: 0,
                fontFamily: TASK_TOKENS.fontFamily,
                fontSize: 13,
                fontWeight: 500,
                gap: 6,
                height: 40,
                padding: '0 10px',
              }}
            >
              <Icon size={15} />
              {tabLabels[tabKey]}
              {tabKey === 'ideas' && inboxIdeaCount > 0 && (
                <span
                  style={{
                    background: TASK_TOKENS.backgroundTertiary,
                    borderRadius: 10,
                    color: TASK_TOKENS.textSecondary,
                    fontSize: 11,
                    padding: '0 6px',
                  }}
                >
                  {inboxIdeaCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {hasFilterBar && (
        <div
          style={{
            alignItems: 'center',
            borderBottom: `1px solid ${TASK_TOKENS.border}`,
            display: 'flex',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: 6,
            minHeight: 40,
            padding: `4px ${inset.right}px 4px ${inset.left}px`,
          }}
        >
          <TaskFilterMenu fields={filterFields} isCompact={isMobile} />
          {assigneeIds.length > 0 && (
            <TaskFilterChip
              label={t('Assignee')}
              value={selectedAssigneeNames.join(', ')}
              onRemove={() => setAssigneeIds([])}
            />
          )}
          {priorityFilter !== ALL_VALUE && (
            <TaskFilterChip
              label={t('Priority')}
              value={t(
                ISSUE_PRIORITY_OPTIONS.find(
                  (option) => option.value === priorityFilter,
                )?.label ?? priorityFilter,
              )}
              onRemove={() => setPriorityFilter(ALL_VALUE)}
            />
          )}
          {typeFilter !== ALL_VALUE && (
            <TaskFilterChip
              label={t('Type')}
              value={t(
                ISSUE_TYPE_OPTIONS.find((option) => option.value === typeFilter)
                  ?.label ?? typeFilter,
              )}
              onRemove={() => setTypeFilter(ALL_VALUE)}
            />
          )}
          {epicFilter !== undefined && (
            <TaskFilterChip
              label={t('Epic')}
              value={
                epicFilter === null
                  ? t('No epic')
                  : (data.epics.find((epic) => epic.id === epicFilter)?.name ??
                    t('Unknown'))
              }
              onRemove={() => setEpicFilter(undefined)}
            />
          )}
          {isFiltered && (
            <TaskButton variant="ghost" size="compact" onClick={clearFilters}>
              {t('Clear')}
            </TaskButton>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {tab === 'list' && (
          <ProductListView
            {...commonProps}
            matchesFilters={matchesFilters}
            healthFilterId={healthFilterId}
            onClearHealthFilter={() => setHealthFilterId(null)}
            isComposerOpen={isComposerOpen}
            onComposerOpenChange={setIsComposerOpen}
            onPlanSprint={(sprintId) => {
              setPlannedSprintId(sprintId);
              changeTab('sprint');
            }}
            onOpenPrioritize={() => changeTab('prioritize')}
          />
        )}
        {tab === 'prioritize' && (
          <ProductPrioritizationView
            {...commonProps}
            matchesFilters={matchesFilters}
            onOpenSettings={() => changeTab('settings')}
          />
        )}
        {tab === 'sprint' && (
          <ProductSprintPlanningView
            {...commonProps}
            selectedSprintId={plannedSprintId}
            onSelectSprint={setPlannedSprintId}
          />
        )}
        {tab === 'ideas' && <ProductIdeasView {...commonProps} />}
        {tab === 'insights' && (
          <ProductInsightsView
            {...commonProps}
            onShowHealthFilter={(filterId: BacklogHealthFilterId) => {
              clearFilters();
              setHealthFilterId(filterId);
              changeTab('list');
            }}
          />
        )}
        {tab === 'settings' && <ProductSettingsView {...commonProps} />}
      </div>

      {selectedIssueId !== null && (
        <twenty-overlay>
          <TaskBoardDetail
            issueId={selectedIssueId}
            navIssueIds={navIssueIds}
            onSelectIssue={setSelectedIssueId}
            onClose={() => setSelectedIssueId(null)}
            boardPath={pagePath}
            onCardChanged={() => void reload()}
          />
        </twenty-overlay>
      )}
    </ProductBacklogFrame>
  );
};

const ProductBacklogFrame = ({ children }: { children: React.ReactNode }) => (
  <section
    style={{
      background: TASK_TOKENS.background,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: TASK_TOKENS.fontFamily,
      height: '100%',
      minHeight: 0,
      width: '100%',
    }}
  >
    {children}
  </section>
);

export default defineFrontComponent({
  universalIdentifier: PRODUCT_BACKLOG_FRONT_COMPONENT_UID,
  name: 'product-backlog',
  description:
    'Product Backlog: ideas, backlog items, prioritization, refinement, sprint planning and backlog insights.',
  component: ProductBacklog,
});
