import { type TaskTodayWindow } from '../types/task-today';

export const readTaskTodayDate = (value: unknown): string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('A valid local date is required.');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error('A valid local date is required.');
  }
  return value;
};

export const addTaskTodayDays = (day: string, days: number): string => {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const readTaskTodayWindow = (
  body: Partial<TaskTodayWindow>,
): TaskTodayWindow => {
  const readBoundary = (value: unknown): string => {
    if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
      throw new Error('Valid day boundaries are required.');
    }
    return new Date(value).toISOString();
  };
  const startOfDay = readBoundary(body.startOfDay);
  const nextDay = readBoundary(body.nextDay);
  const upcomingEnd = readBoundary(body.upcomingEnd);
  if (startOfDay >= nextDay || nextDay >= upcomingEnd) {
    throw new Error('Day boundaries must be in order.');
  }
  return { startOfDay, nextDay, upcomingEnd };
};
