export type CustomEmailConfig = {
  endpoint: string;
  headers: Record<string, string>;
  bodyTemplate: unknown;
};
