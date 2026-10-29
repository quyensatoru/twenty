import { TEAM_MOMENTS_COPY_BY_LOCALE } from '@/team-moments/constants/TeamMomentsCopyByLocale';
import { type TeamMomentsCopy } from '@/team-moments/types/TeamMomentsCopy';

export const getTeamMomentsCopy = (locale: string): TeamMomentsCopy =>
  locale.startsWith('vi')
    ? TEAM_MOMENTS_COPY_BY_LOCALE['vi-VN']
    : TEAM_MOMENTS_COPY_BY_LOCALE.en;
