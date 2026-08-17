import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type SpecialDayDataSeed = {
  id: string;
  position: number;
  name: string;
  kind: string;
  month: number | null;
  day: number | null;
  date: string | null;
  multiplier: number;
  isActive: boolean;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const SPECIAL_DAY_DATA_SEED_COLUMNS: (keyof SpecialDayDataSeed)[] = [
  'id',
  'position',
  'name',
  'kind',
  'month',
  'day',
  'date',
  'multiplier',
  'isActive',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const SPECIAL_DAY_DATA_SEED_IDS = {
  NEW_YEAR: '77777777-0001-4e7c-8001-123456789abc',
  REUNIFICATION_DAY: '77777777-0002-4e7c-8001-123456789abc',
  LABOUR_DAY: '77777777-0003-4e7c-8001-123456789abc',
  NATIONAL_DAY: '77777777-0004-4e7c-8001-123456789abc',
  LUNAR_NEW_YEAR_DAY_1: '77777777-0005-4e7c-8001-123456789abc',
  LUNAR_NEW_YEAR_DAY_2: '77777777-0006-4e7c-8001-123456789abc',
  LUNAR_NEW_YEAR_DAY_3: '77777777-0007-4e7c-8001-123456789abc',
  LUNAR_NEW_YEAR_DAY_4: '77777777-0008-4e7c-8001-123456789abc',
  LUNAR_NEW_YEAR_DAY_5: '77777777-0009-4e7c-8001-123456789abc',
};

const { TIM } = WORKSPACE_MEMBER_DATA_SEED_IDS;

const BUILD_CREATED_UPDATED_BY = (workspaceMemberId: string, name: string) => ({
  createdBySource: 'MANUAL',
  createdByWorkspaceMemberId: workspaceMemberId,
  createdByName: name,
  updatedBySource: 'MANUAL',
  updatedByWorkspaceMemberId: workspaceMemberId,
  updatedByName: name,
});

// 9 demo special days: 4 recurring Vietnamese public holidays (YEARLY) plus
// the 5 days of Tết Nguyên Đán 2026 (SPECIFIC, fixed dates since the lunar
// calendar shifts every solar year).
export const SPECIAL_DAY_DATA_SEEDS: SpecialDayDataSeed[] = [
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.NEW_YEAR,
    position: 1,
    name: 'Tết dương lịch',
    kind: 'YEARLY',
    month: 1,
    day: 1,
    date: null,
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.REUNIFICATION_DAY,
    position: 2,
    name: 'Giải phóng miền Nam',
    kind: 'YEARLY',
    month: 4,
    day: 30,
    date: null,
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.LABOUR_DAY,
    position: 3,
    name: 'Quốc tế lao động',
    kind: 'YEARLY',
    month: 5,
    day: 1,
    date: null,
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.NATIONAL_DAY,
    position: 4,
    name: 'Quốc khánh',
    kind: 'YEARLY',
    month: 9,
    day: 2,
    date: null,
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.LUNAR_NEW_YEAR_DAY_1,
    position: 5,
    name: 'Tết âm lịch 2026 (mùng 1)',
    kind: 'SPECIFIC',
    month: null,
    day: null,
    date: '2026-02-16',
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.LUNAR_NEW_YEAR_DAY_2,
    position: 6,
    name: 'Tết âm lịch 2026 (mùng 2)',
    kind: 'SPECIFIC',
    month: null,
    day: null,
    date: '2026-02-17',
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.LUNAR_NEW_YEAR_DAY_3,
    position: 7,
    name: 'Tết âm lịch 2026 (mùng 3)',
    kind: 'SPECIFIC',
    month: null,
    day: null,
    date: '2026-02-18',
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.LUNAR_NEW_YEAR_DAY_4,
    position: 8,
    name: 'Tết âm lịch 2026 (mùng 4)',
    kind: 'SPECIFIC',
    month: null,
    day: null,
    date: '2026-02-19',
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: SPECIAL_DAY_DATA_SEED_IDS.LUNAR_NEW_YEAR_DAY_5,
    position: 9,
    name: 'Tết âm lịch 2026 (mùng 5)',
    kind: 'SPECIFIC',
    month: null,
    day: null,
    date: '2026-02-20',
    multiplier: 2,
    isActive: true,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
];
