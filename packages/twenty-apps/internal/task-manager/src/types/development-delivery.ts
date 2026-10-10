export type DevelopmentDelivery = {
  deliveryType: 'BUILD' | 'DEPLOYMENT';
  externalId: string;
  eventId: string;
  title: string;
  status: string;
  commitSha: string | null;
  branchName: string | null;
  pipelineId: string | null;
  environmentName: string | null;
  environmentType: string | null;
  occurredAt: string;
  startedAt: string | null;
  url: string | null;
  text: string | null;
};

export type DevelopmentDeliveryRow = Omit<DevelopmentDelivery, 'text'> & {
  id: string;
  repositoryId: string | null;
  issueId?: string;
};
