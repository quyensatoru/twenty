import { type TeamMomentsCopy } from '@/team-moments/types/TeamMomentsCopy';

// Fork-only copy kept out of the Lingui catalogs so they stay identical to
// upstream and merge without conflicts.
export const TEAM_MOMENTS_COPY_BY_LOCALE: Record<
  'en' | 'vi-VN',
  TeamMomentsCopy
> = {
  en: {
    yourBirthday: 'Your birthday',
    memberBirthday: (memberName) => `${memberName}'s birthday`,
    turnsToday: (years) => `Turns ${years} today`,
    yourWorkAnniversary: 'Your work anniversary',
    memberWorkAnniversary: (memberName) => `${memberName}'s work anniversary`,
    yearsWithTeam: (years) =>
      years === 1 ? '1 year with the team' : `${years} years with the team`,
    holiday: 'Holiday',
    teamEvent: 'Team event',
    youAreCelebrated: 'You are one of the people celebrated today',
    celebratingFemaleTeammates: (count) =>
      count === 1
        ? 'Celebrating 1 female teammate'
        : `Celebrating ${count} female teammates`,
    celebratingMaleTeammates: (count) =>
      count === 1
        ? 'Celebrating 1 male teammate'
        : `Celebrating ${count} male teammates`,
    today: (date) => `Today · ${date}`,
    allAboutYou: 'This day is all about you!',
    specialOccasions: (count) =>
      count === 1
        ? 'A special day for the team'
        : `${count} special occasions today`,
    somethingWaiting: 'Your teammates have something waiting for you.',
    sendYourWishes: 'Take a minute to send your wishes.',
    later: 'Later',
    openMyWishes: 'Open my wishes',
    sendWishes: 'Send wishes',
  },
  'vi-VN': {
    yourBirthday: 'Sinh nhật của bạn',
    memberBirthday: (memberName) => `Sinh nhật ${memberName}`,
    turnsToday: (years) => `Tròn ${years} tuổi hôm nay`,
    yourWorkAnniversary: 'Kỷ niệm ngày vào công ty của bạn',
    memberWorkAnniversary: (memberName) =>
      `Kỷ niệm ngày vào công ty của ${memberName}`,
    yearsWithTeam: (years) => `${years} năm đồng hành cùng team`,
    holiday: 'Ngày lễ',
    teamEvent: 'Sự kiện của team',
    youAreCelebrated: 'Bạn là một trong những người được chúc mừng hôm nay',
    celebratingFemaleTeammates: (count) =>
      `Chúc mừng ${count} thành viên nữ`,
    celebratingMaleTeammates: (count) => `Chúc mừng ${count} thành viên nam`,
    today: (date) => `Hôm nay · ${date}`,
    allAboutYou: 'Hôm nay là ngày của bạn!',
    specialOccasions: (count) =>
      count === 1
        ? 'Một ngày đặc biệt của team'
        : `${count} dịp đặc biệt hôm nay`,
    somethingWaiting: 'Đồng nghiệp đang có điều bất ngờ dành cho bạn.',
    sendYourWishes: 'Dành một phút gửi lời chúc nhé.',
    later: 'Để sau',
    openMyWishes: 'Xem lời chúc',
    sendWishes: 'Gửi lời chúc',
  },
};
