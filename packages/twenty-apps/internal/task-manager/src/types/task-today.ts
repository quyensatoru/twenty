import { type PersonalBoardPreferences } from './task-personal-board';
import { type TASK_TODAY_SECTIONS } from '../constants/task-today';
import {
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
} from './task-manager-rows';

export type TaskTodaySection = (typeof TASK_TODAY_SECTIONS)[number];

export type TaskTodayWindow = {
  startOfDay: string;
  nextDay: string;
  upcomingEnd: string;
};

export type TaskTodayNotification = {
  id: string;
  issueId: string;
  commentId: string;
  body: string;
  createdAt: string;
};

export type TaskTodayData = {
  success: true;
  day: string;
  section: TaskTodaySection;
  hasMember: boolean;
  memberId?: string | null;
  boardPreferences?: PersonalBoardPreferences;
  issues: IssueRow[];
  projects: (ProjectRow & { canWrite: boolean })[];
  issueStatuses: IssueStatusRow[];
  counts: Record<TaskTodaySection, number>;
  endCursor: string | null;
  hasNextPage: boolean;
  notifications: TaskTodayNotification[];
  unreadCount: number;
};
