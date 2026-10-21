import {
  DEFAULT_HEADER_NAME,
  DEFAULT_MONITOR_POLICY,
  INTERVAL_MINUTE_OPTIONS,
  RETENTION_HOUR_OPTIONS,
  TIMEOUT_SECOND_OPTIONS,
} from '../constants/health-options';
import { HEALTH_METRICS, type HealthRuleMetric } from '../types/health-metric';
import { type HealthMonitorConfig } from '../types/health-monitor-config';
import { type HealthRecipient } from '../types/health-recipient';
import { type HealthRule } from '../types/health-rule';
import { readNumber } from './read-number.util';

type ConfigInput = Record<string, unknown>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pickOption = <TOption extends number>(
  value: unknown,
  options: readonly TOption[],
  fallback: TOption,
): TOption =>
  options.includes(value as TOption) ? (value as TOption) : fallback;

const clampInteger = (
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number => {
  const number = readNumber(value);

  return number === null
    ? fallback
    : Math.min(max, Math.max(min, Math.round(number)));
};

const readText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const readNullableNumber = (value: unknown): number | null =>
  value === null || value === '' ? null : readNumber(Number(value));

const readRecipients = (value: unknown): HealthRecipient[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();

  return value.flatMap((entry) => {
    const memberId = readText((entry as { memberId?: unknown })?.memberId);
    const minSeverity =
      (entry as { minSeverity?: unknown })?.minSeverity === 'CRITICAL'
        ? 'CRITICAL'
        : 'WARNING';

    if (memberId.length === 0 || seen.has(memberId)) {
      return [];
    }

    seen.add(memberId);

    return [{ memberId, minSeverity }];
  });
};

const readRules = (value: unknown): HealthRule[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index) => {
    const source = (entry ?? {}) as Record<string, unknown>;
    const metric = source.metric as HealthRuleMetric;

    if (
      !HEALTH_METRICS.includes(metric) ||
      (metric as string) === 'ENDPOINT_UNREACHABLE'
    ) {
      return [];
    }

    const scopeNodeKey = readText(source.scopeNodeKey);
    const scopeServiceName = readText(source.scopeServiceName);
    const warningValue = readNullableNumber(source.warningValue);
    const criticalValue = readNullableNumber(source.criticalValue);

    if (
      warningValue !== null &&
      criticalValue !== null &&
      warningValue > criticalValue
    ) {
      throw new Error(
        `Rule ${index + 1} has a warning threshold above its critical threshold.`,
      );
    }

    return [
      {
        id: readText(source.id) || `rule-${index + 1}`,
        metric,
        scopeNodeKey: scopeNodeKey.length > 0 ? scopeNodeKey : null,
        scopeServiceName: scopeServiceName.length > 0 ? scopeServiceName : null,
        warningValue,
        criticalValue,
        isEnabled: source.isEnabled !== false,
      },
    ];
  });
};

const NODE_LABEL_MAX_LENGTH = 60;

const readNodeLabels = (value: unknown): Record<string, string> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, label]) => {
      const text = readText(label).slice(0, NODE_LABEL_MAX_LENGTH);

      return key.trim().length > 0 && text.length > 0
        ? [[key.trim(), text]]
        : [];
    }),
  );
};

const readStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map(readText).filter((item) => item.length > 0))]
    : [];

export const normalizeHealthMonitorConfig = (
  input: unknown,
): HealthMonitorConfig => {
  const source = (input ?? {}) as ConfigInput;
  const endpointUrl = readText(source.endpointUrl);

  if (!/^https?:\/\/\S+$/i.test(endpointUrl)) {
    throw new Error('The endpoint must be a valid http(s) URL.');
  }

  const extraEmails = readStringList(source.extraEmails).map((email) =>
    email.toLowerCase(),
  );
  const invalidEmail = extraEmails.find((email) => !EMAIL_PATTERN.test(email));

  if (invalidEmail !== undefined) {
    throw new Error(`Invalid email: ${invalidEmail}`);
  }

  const headerValue =
    typeof source.headerValue === 'string' ? source.headerValue.trim() : null;

  return {
    isEnabled: source.isEnabled === true,
    endpointUrl,
    headerName: readText(source.headerName) || DEFAULT_HEADER_NAME,
    headerValue:
      headerValue === null || headerValue.length === 0 ? null : headerValue,
    hasHeaderValue: false,
    intervalMinutes: pickOption(
      source.intervalMinutes,
      INTERVAL_MINUTE_OPTIONS,
      DEFAULT_MONITOR_POLICY.intervalMinutes,
    ),
    timeoutSeconds: pickOption(
      source.timeoutSeconds,
      TIMEOUT_SECOND_OPTIONS,
      DEFAULT_MONITOR_POLICY.timeoutSeconds,
    ),
    openAfterBreaches: clampInteger(
      source.openAfterBreaches,
      1,
      10,
      DEFAULT_MONITOR_POLICY.openAfterBreaches,
    ),
    renotifyMinutes: clampInteger(
      source.renotifyMinutes,
      5,
      1440,
      DEFAULT_MONITOR_POLICY.renotifyMinutes,
    ),
    unreachableAfterFailures: clampInteger(
      source.unreachableAfterFailures,
      1,
      10,
      DEFAULT_MONITOR_POLICY.unreachableAfterFailures,
    ),
    sendRecovery: source.sendRecovery !== false,
    criticalOnlyOffHours: source.criticalOnlyOffHours === true,
    snapshotRetentionHours: pickOption(
      source.snapshotRetentionHours,
      RETENTION_HOUR_OPTIONS,
      DEFAULT_MONITOR_POLICY.snapshotRetentionHours,
    ),
    recipients: readRecipients(source.recipients),
    extraEmails,
    rules: readRules(source.rules),
    mutedNodeKeys: readStringList(source.mutedNodeKeys),
    nodeLabels: readNodeLabels(source.nodeLabels),
  };
};
