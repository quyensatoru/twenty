import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

const WORKSPACE_ID = '20202020-1111-4111-8111-111111111111';
const TWENTY_STANDARD_APPLICATION_ID = '20202020-2222-4222-8222-222222222222';
const NOW = '2024-01-01T00:00:00.000Z';

describe('TimelineActivity <-> Issue/Epic activity targets', () => {
  const { allFlatEntityMaps } =
    computeTwentyStandardApplicationAllFlatEntityMaps({
      now: NOW,
      workspaceId: WORKSPACE_ID,
      twentyStandardApplicationId: TWENTY_STANDARD_APPLICATION_ID,
    });
  const { byUniversalIdentifier: fieldsByUniversalIdentifier } =
    allFlatEntityMaps.flatFieldMetadataMaps;
  const { byUniversalIdentifier: objectsByUniversalIdentifier } =
    allFlatEntityMaps.flatObjectMetadataMaps;

  const getField = (universalIdentifier: string) =>
    fieldsByUniversalIdentifier[universalIdentifier];

  it('creates a targetIssue morph-relation field on TimelineActivity pointing back at Issue.timelineActivities', () => {
    const targetIssue = getField(
      STANDARD_OBJECTS.timelineActivity.fields.targetIssue.universalIdentifier,
    );
    const issueTimelineActivities = getField(
      STANDARD_OBJECTS.issue.fields.timelineActivities.universalIdentifier,
    );
    const issueObject =
      objectsByUniversalIdentifier[STANDARD_OBJECTS.issue.universalIdentifier];

    expect(targetIssue?.type).toBe(FieldMetadataType.MORPH_RELATION);
    expect(targetIssue?.relationTargetObjectMetadataId).toBe(issueObject?.id);
    expect(targetIssue?.relationTargetFieldMetadataId).toBe(
      issueTimelineActivities?.id,
    );
  });

  it('creates a targetEpic morph-relation field on TimelineActivity pointing back at Epic.timelineActivities', () => {
    const targetEpic = getField(
      STANDARD_OBJECTS.timelineActivity.fields.targetEpic.universalIdentifier,
    );
    const epicTimelineActivities = getField(
      STANDARD_OBJECTS.epic.fields.timelineActivities.universalIdentifier,
    );
    const epicObject =
      objectsByUniversalIdentifier[STANDARD_OBJECTS.epic.universalIdentifier];

    expect(targetEpic?.type).toBe(FieldMetadataType.MORPH_RELATION);
    expect(targetEpic?.relationTargetObjectMetadataId).toBe(epicObject?.id);
    expect(targetEpic?.relationTargetFieldMetadataId).toBe(
      epicTimelineActivities?.id,
    );
  });

  it('creates the reciprocal timelineActivities ONE_TO_MANY relation on Issue and Epic', () => {
    const issueTimelineActivities = getField(
      STANDARD_OBJECTS.issue.fields.timelineActivities.universalIdentifier,
    );
    const epicTimelineActivities = getField(
      STANDARD_OBJECTS.epic.fields.timelineActivities.universalIdentifier,
    );

    expect(issueTimelineActivities?.settings?.relationType).toBe(
      RelationType.ONE_TO_MANY,
    );
    expect(epicTimelineActivities?.settings?.relationType).toBe(
      RelationType.ONE_TO_MANY,
    );
  });
});
