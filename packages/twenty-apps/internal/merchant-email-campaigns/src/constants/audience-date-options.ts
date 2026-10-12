import {
  type AudienceDateField,
  type AudienceDateOperator,
  type AudienceDateUnit,
} from '../types/audience-filter';

export const AUDIENCE_DATE_FIELD_OPTIONS: {
  value: AudienceDateField;
  label: string;
}[] = [
  { value: 'installedAt', label: 'Installed at' },
  { value: 'uninstalledAt', label: 'Uninstalled at' },
  { value: 'createdAt', label: 'Added to CRM' },
  { value: 'emailUnsubscribedAt', label: 'Unsubscribed at' },
];

export const AUDIENCE_DATE_OPERATOR_OPTIONS: {
  value: AudienceDateOperator;
  label: string;
}[] = [
  { value: 'IN_LAST', label: 'In the last' },
  { value: 'MORE_THAN_AGO', label: 'More than … ago' },
  { value: 'BEFORE', label: 'Before' },
  { value: 'ON_OR_AFTER', label: 'On or after' },
  { value: 'BETWEEN', label: 'Between' },
  { value: 'IS_EMPTY', label: 'Is empty' },
  { value: 'IS_NOT_EMPTY', label: 'Is not empty' },
];

export const AUDIENCE_DATE_UNIT_OPTIONS: {
  value: AudienceDateUnit;
  label: string;
}[] = [
  { value: 'DAY', label: 'Days' },
  { value: 'WEEK', label: 'Weeks' },
  { value: 'MONTH', label: 'Months' },
];
