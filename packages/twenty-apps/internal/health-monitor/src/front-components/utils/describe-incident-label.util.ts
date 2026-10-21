import { type HealthIncidentRecord } from '../../types/health-incident-record';
import { describeIncident } from '../../utils/describe-incident.util';
import { type NodeLabels } from '../../utils/format-node-label.util';
import { translate } from './translate-front.util';

export const describeIncidentLabel = (
  incident: HealthIncidentRecord,
  nodeLabels: NodeLabels = {},
): string =>
  describeIncident(
    {
      metric: incident.metric,
      nodeKey: incident.nodeKey,
      serviceName: incident.serviceName,
      threshold: incident.threshold,
      value: incident.lastValue,
    },
    translate,
    nodeLabels,
  );
