import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { LazyRoute } from '@/app/components/LazyRoute';
import {
  createSettingsRouteObjects,
  SettingsRouteOutlet,
} from '@/app/components/SettingsRoutes';
import { type WorkspaceRouteObject } from '@/app/routing/types/WorkspaceRouteObject';
import { RecordIndexSkeletonLoader } from '@/object-record/record-index/components/RecordIndexSkeletonLoader';

const WorkflowCoreIndexPage = lazy(() =>
  import('~/pages/object-core/WorkflowCoreIndexPage').then((module) => ({
    default: module.WorkflowCoreIndexPage,
  })),
);

const WorkflowCoreShowPage = lazy(() =>
  import('~/pages/object-core/WorkflowCoreShowPage').then((module) => ({
    default: module.WorkflowCoreShowPage,
  })),
);

const RecordIndexPage = lazy(() =>
  import('~/pages/object-record/RecordIndexPage').then((module) => ({
    default: module.RecordIndexPage,
  })),
);

const RecordShowPage = lazy(() =>
  import('~/pages/object-record/RecordShowPage').then((module) => ({
    default: module.RecordShowPage,
  })),
);

const StandalonePageLayoutPage = lazy(() =>
  import('~/pages/page-layout/StandalonePageLayoutPage').then((module) => ({
    default: module.StandalonePageLayoutPage,
  })),
);

const TaskManagerBoardPage = lazy(() =>
  import('~/pages/task-manager/TaskManagerBoardPage').then((module) => ({
    default: module.TaskManagerBoardPage,
  })),
);

const TaskManagerBacklogPage = lazy(() =>
  import('~/pages/task-manager/TaskManagerBacklogPage').then((module) => ({
    default: module.TaskManagerBacklogPage,
  })),
);

const TaskManagerRoadmapPage = lazy(() =>
  import('~/pages/task-manager/TaskManagerRoadmapPage').then((module) => ({
    default: module.TaskManagerRoadmapPage,
  })),
);

const TaskManagerIssuePage = lazy(() =>
  import('~/pages/task-manager/TaskManagerIssuePage').then((module) => ({
    default: module.TaskManagerIssuePage,
  })),
);

const ShiftPage = lazy(() =>
  import('~/pages/shift/ShiftPage').then((module) => ({
    default: module.ShiftPage,
  })),
);

const ShiftRegisterPage = lazy(() =>
  import('~/pages/shift/ShiftRegisterPage').then((module) => ({
    default: module.ShiftRegisterPage,
  })),
);

const ShiftReportPage = lazy(() =>
  import('~/pages/shift/ShiftReportPage').then((module) => ({
    default: module.ShiftReportPage,
  })),
);

const ShiftAnalyticsPage = lazy(() =>
  import('~/pages/shift/ShiftAnalyticsPage').then((module) => ({
    default: module.ShiftAnalyticsPage,
  })),
);

const AiChatPage = lazy(() =>
  import('~/pages/ai-chat/AiChatPage').then((module) => ({
    default: module.AiChatPage,
  })),
);

const MobileHomePage = lazy(() =>
  import('~/pages/mobile-home/MobileHomePage').then((module) => ({
    default: module.MobileHomePage,
  })),
);

const NotFound = lazy(() =>
  import('~/pages/not-found/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

type CreateWorkspaceRouteObjectsArgs = {
  isAdminPageEnabled?: boolean;
  isWorkflowCoreIndexPageEnabled?: boolean;
};

const MAIN_AND_SIDE_PANEL = ['main', 'side-panel'] as const;
const SETTINGS_ROOT_PATH = AppPath.SettingsCatchAll.replace('/*', '');

export const createWorkspaceRouteObjects = ({
  isAdminPageEnabled,
  isWorkflowCoreIndexPageEnabled,
}: CreateWorkspaceRouteObjectsArgs): WorkspaceRouteObject[] => {
  const settingsRouteObjects = createSettingsRouteObjects({
    isAdminPageEnabled,
  });

  return [
    {
      path: AppPath.WorkflowCoreShowPage,
      element: (
        <LazyRoute>
          <WorkflowCoreShowPage />
        </LazyRoute>
      ),
      handle: {
        workspaceSurfaces: MAIN_AND_SIDE_PANEL,
        isLocationExpandableFromSidePanel: true,
      },
    },
    ...(isWorkflowCoreIndexPageEnabled
      ? [
          {
            path: AppPath.WorkflowCoreIndexPage,
            element: (
              <LazyRoute>
                <WorkflowCoreIndexPage />
              </LazyRoute>
            ),
            handle: {
              workspaceSurfaces: MAIN_AND_SIDE_PANEL,
              isLocationExpandableFromSidePanel: true,
            },
          } satisfies WorkspaceRouteObject,
        ]
      : []),
    {
      path: AppPath.Index,
      element: <RecordIndexSkeletonLoader />,
    },
    {
      path: AppPath.RecordIndexPage,
      element: (
        <LazyRoute fallback={<RecordIndexSkeletonLoader />}>
          <RecordIndexPage />
        </LazyRoute>
      ),
      handle: {
        workspaceSurfaces: MAIN_AND_SIDE_PANEL,
        isLocationExpandableFromSidePanel: true,
      },
    },
    {
      path: AppPath.RecordShowPage,
      element: (
        <LazyRoute>
          <RecordShowPage />
        </LazyRoute>
      ),
      handle: { workspaceSurfaces: MAIN_AND_SIDE_PANEL },
    },
    {
      path: AppPath.PageLayoutPage,
      element: (
        <LazyRoute>
          <StandalonePageLayoutPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.TaskManagerBoardPage,
      element: (
        <LazyRoute>
          <TaskManagerBoardPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.TaskManagerBacklogPage,
      element: (
        <LazyRoute>
          <TaskManagerBacklogPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.TaskManagerRoadmapPage,
      element: (
        <LazyRoute>
          <TaskManagerRoadmapPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.TaskManagerIssuePage,
      element: (
        <LazyRoute>
          <TaskManagerIssuePage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.ShiftPage,
      element: (
        <LazyRoute>
          <ShiftPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.ShiftRegisterPage,
      element: (
        <LazyRoute>
          <ShiftRegisterPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.ShiftReportPage,
      element: (
        <LazyRoute>
          <ShiftReportPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.ShiftAnalyticsPage,
      element: (
        <LazyRoute>
          <ShiftAnalyticsPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.AiChat,
      element: (
        <LazyRoute>
          <AiChatPage />
        </LazyRoute>
      ),
    },
    {
      path: AppPath.Home,
      element: (
        <LazyRoute>
          <MobileHomePage />
        </LazyRoute>
      ),
    },
    {
      path: SETTINGS_ROOT_PATH,
      element: <SettingsRouteOutlet />,
      children: settingsRouteObjects,
    },
    {
      path: AppPath.Dpa,
      element: <Navigate to={getSettingsPath(SettingsPath.LegalDpa)} replace />,
    },
    {
      path: AppPath.NotFoundWildcard,
      element: (
        <LazyRoute>
          <NotFound />
        </LazyRoute>
      ),
    },
  ];
};
