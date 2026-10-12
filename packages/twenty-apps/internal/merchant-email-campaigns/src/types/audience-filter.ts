export type InstallStatusFilter = 'ANY' | 'INSTALLED' | 'UNINSTALLED';

export type AudienceDateField =
  | 'installedAt'
  | 'uninstalledAt'
  | 'createdAt'
  | 'emailUnsubscribedAt';

export type AudienceDateOperator =
  | 'IN_LAST'
  | 'MORE_THAN_AGO'
  | 'BEFORE'
  | 'ON_OR_AFTER'
  | 'BETWEEN'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY';

export type AudienceDateUnit = 'DAY' | 'WEEK' | 'MONTH';

// `amount` and `unit` serve the relative operators, `date` and `endDate`
// (YYYY-MM-DD, UTC) the calendar ones; the others are ignored.
export type AudienceDateCondition = {
  field: AudienceDateField;
  operator: AudienceDateOperator;
  amount: number | null;
  unit: AudienceDateUnit;
  date: string | null;
  endDate: string | null;
};

export type AudienceFilter = {
  appIds: string[];
  installStatus: InstallStatusFilter;
  shopifyPlans: string[];
  pricingPlans: string[];
  countries: string[];
  dateConditions: AudienceDateCondition[];
};
