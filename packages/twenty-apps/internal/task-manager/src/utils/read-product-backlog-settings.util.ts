import { DEFAULT_PRODUCT_BACKLOG_SETTINGS } from '../constants/product-backlog';
import {
  type Competitor,
  type ProductBacklogSettings,
  type ReadinessCriterion,
  type Stakeholder,
  type StrategicGoal,
} from '../types/product-backlog';

type JsonRecord = Record<string, unknown>;

const readRecord = (value: unknown): JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const readList = <TEntry>(
  value: unknown,
  readEntry: (entry: JsonRecord) => TEntry | null,
  fallback: TEntry[],
): TEntry[] =>
  Array.isArray(value)
    ? value
        .map((entry) => readEntry(readRecord(entry)))
        .filter((entry): entry is TEntry => entry !== null)
    : fallback;

const readGoal = (entry: JsonRecord): StrategicGoal | null => {
  const id = readText(entry.id);
  const name = readText(entry.name);

  return id === null || name === null
    ? null
    : { id, name, color: readText(entry.color) ?? 'purple' };
};

const readCriterion = (entry: JsonRecord): ReadinessCriterion | null => {
  const id = readText(entry.id);
  const text = readText(entry.text);

  return id === null || text === null ? null : { id, text };
};

const readCompetitor = (entry: JsonRecord): Competitor | null => {
  const id = readText(entry.id);
  const name = readText(entry.name);

  return id === null || name === null
    ? null
    : { id, name, type: entry.type === 'INDIRECT' ? 'INDIRECT' : 'DIRECT' };
};

const readStakeholder = (entry: JsonRecord): Stakeholder | null => {
  const id = readText(entry.id);
  const name = readText(entry.name);

  return id === null || name === null ? null : { id, name };
};

// The stored JSON outlives every version of this shape: anything missing or
// malformed falls back to the default, field by field.
export const readProductBacklogSettings = (
  value: unknown,
): ProductBacklogSettings => {
  const stored = readRecord(value);
  const defaults = DEFAULT_PRODUCT_BACKLOG_SETTINGS;
  const weights = readRecord(stored.competitorWeights);
  const adoption = readRecord(stored.adoptionScores);
  const phases = readRecord(stored.phaseThresholds);
  const moscow = readRecord(stored.moscowPoints);

  return {
    goals: readList(stored.goals, readGoal, defaults.goals),
    readinessCriteria: readList(
      stored.readinessCriteria,
      readCriterion,
      defaults.readinessCriteria,
    ),
    activeTemplateId:
      readText(stored.activeTemplateId) ?? defaults.activeTemplateId,
    competitors: readList(
      stored.competitors,
      readCompetitor,
      defaults.competitors,
    ),
    competitorWeights: {
      DIRECT: readNumber(weights.DIRECT, defaults.competitorWeights.DIRECT),
      INDIRECT: readNumber(
        weights.INDIRECT,
        defaults.competitorWeights.INDIRECT,
      ),
    },
    adoptionScores: {
      NO: readNumber(adoption.NO, defaults.adoptionScores.NO),
      BASIC: readNumber(adoption.BASIC, defaults.adoptionScores.BASIC),
      GOOD: readNumber(adoption.GOOD, defaults.adoptionScores.GOOD),
      ADVANCED: readNumber(adoption.ADVANCED, defaults.adoptionScores.ADVANCED),
    },
    phaseThresholds: {
      phaseOne: readNumber(phases.phaseOne, defaults.phaseThresholds.phaseOne),
      phaseTwo: readNumber(phases.phaseTwo, defaults.phaseThresholds.phaseTwo),
      phaseThree: readNumber(
        phases.phaseThree,
        defaults.phaseThresholds.phaseThree,
      ),
    },
    moscowPoints: {
      M: readNumber(moscow.M, defaults.moscowPoints.M),
      S: readNumber(moscow.S, defaults.moscowPoints.S),
      C: readNumber(moscow.C, defaults.moscowPoints.C),
      W: readNumber(moscow.W, defaults.moscowPoints.W),
    },
    stakeholders: readList(
      stored.stakeholders,
      readStakeholder,
      defaults.stakeholders,
    ),
    lastBacklogReviewAt: readText(stored.lastBacklogReviewAt),
  };
};

// When the project's existing issues were sorted into items and issues. Kept
// in the same JSON, outside the settings people edit.
export const readProductBacklogMigratedAt = (value: unknown): string | null =>
  readText(readRecord(value).migratedAt);
