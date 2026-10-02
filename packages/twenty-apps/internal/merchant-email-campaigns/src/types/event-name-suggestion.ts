export type EventNameSuggestion = {
  name: string;
  label: string;
  isBuiltIn: boolean;
  receivedCount: number;
  lastReceivedAt: string | null;
  automationCount: number;
};
