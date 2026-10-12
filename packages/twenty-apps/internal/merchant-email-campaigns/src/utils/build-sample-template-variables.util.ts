import { TEMPLATE_VARIABLE_DEFINITIONS } from '../constants/template-variable-definitions';
import { type TemplateVariables } from '../types/template-variables';

export const SAMPLE_DAYS_SINCE_INSTALL = 9;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// `daysSinceInstall` lets the editor preview every branch of a date
// condition, e.g. the "30 days after install" block.
export const buildSampleTemplateVariables = ({
  daysSinceInstall = SAMPLE_DAYS_SINCE_INSTALL,
  now = new Date(),
}: { daysSinceInstall?: number; now?: Date } = {}): TemplateVariables => {
  const installedAt = new Date(
    now.getTime() - daysSinceInstall * DAY_IN_MS,
  ).toISOString();

  return {
    ...(Object.fromEntries(
      TEMPLATE_VARIABLE_DEFINITIONS.map(({ key, sample }) => [key, sample]),
    ) as unknown as TemplateVariables),
    dates: { installedAt, uninstalledAt: null, addedToCrmAt: installedAt },
    now: now.toISOString(),
  };
};
