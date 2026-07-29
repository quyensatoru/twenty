import { Injectable } from '@nestjs/common';

import { type ObjectRecord } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In, MoreThan } from 'typeorm';

import { objectRecordDiffMerge } from 'src/engine/core-modules/event-emitter/utils/object-record-diff-merge';
import { getFlatFieldsFromFlatObjectMetadata } from 'src/engine/api/graphql/workspace-schema-builder/utils/get-flat-fields-for-flat-object-metadata.util';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { getObjectMetadataIdByName } from 'src/engine/metadata-modules/flat-object-metadata/utils/get-object-metadata-id-by-name.util';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type TimelineActivityPayload } from 'src/modules/timeline/types/timeline-activity-payload';
import { buildTimelineActivityRelatedMorphFieldMetadataName } from 'src/modules/timeline/utils/timeline-activity-related-morph-field-metadata-name-builder.util';

type TimelineActivityPayloadWorkspaceIdAndObjectSingularName = {
  payloads: (Omit<TimelineActivityPayload, 'properties'> & {
    properties: Pick<TimelineActivityPayload['properties'], 'diff'>;
  })[];
  workspaceId: string;
  objectSingularName: string;
};

type TimelineActivityPayloadWorkspaceIdAndPropertyName = Omit<
  TimelineActivityPayloadWorkspaceIdAndObjectSingularName,
  'objectSingularName'
> & {
  timelineActivityPropertyName: string;
};

@Injectable()
export class TimelineActivityRepository {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly workspaceManyOrAllFlatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  async upsertTimelineActivities({
    objectSingularName,
    workspaceId,
    payloads,
  }: TimelineActivityPayloadWorkspaceIdAndObjectSingularName) {
    const timelineActivityPropertyName =
      await this.getTimelineActivityPropertyName(
        objectSingularName,
        workspaceId,
      );

    // timelineActivity has no target field wired for this object type (e.g. a
    // new standard object added without its target<Object> relation) — skip
    // rather than crash, since the activity feed is a non-critical side effect.
    if (!isDefined(timelineActivityPropertyName)) {
      return;
    }

    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const recentTimelineActivities = await this.findRecentTimelineActivities({
        timelineActivityPropertyName,
        workspaceId,
        payloads,
      });

      const payloadsToUpsert = payloads.flatMap(
        ({ name, properties, ...rest }) => {
          const [objectName, action] = name.split('.');
          const { diff } = properties;
          const hasDiff = isDefined(diff) && Object.keys(diff).length > 0;

          if (objectName.startsWith('linked-')) {
            return [{ ...rest, name, properties: hasDiff ? { diff } : {} }];
          }

          if (action === 'updated') {
            return hasDiff ? [{ ...rest, name, properties: { diff } }] : [];
          }

          return [{ ...rest, name, properties: {} }];
        },
      );

      const payloadsToInsert: TimelineActivityPayloadWorkspaceIdAndObjectSingularName['payloads'] =
        [];

      for (const payload of payloadsToUpsert) {
        const recentTimelineActivity = recentTimelineActivities.find(
          (timelineActivity) =>
            timelineActivity[timelineActivityPropertyName] ===
              payload.recordId &&
            timelineActivity.workspaceMemberId === payload.workspaceMemberId &&
            (!isDefined(payload.linkedRecordId) ||
              timelineActivity.linkedRecordId === payload.linkedRecordId) &&
            timelineActivity.name === payload.name,
        );

        if (recentTimelineActivity) {
          const mergedProperties = objectRecordDiffMerge(
            recentTimelineActivity.properties,
            payload.properties,
          );

          await this.updateTimelineActivity({
            id: recentTimelineActivity.id,
            properties: mergedProperties,
            workspaceMemberId: payload.workspaceMemberId,
            workspaceId,
          });
        } else {
          payloadsToInsert.push(payload);
        }
      }

      await this.insertTimelineActivities({
        timelineActivityPropertyName,
        payloads: payloadsToInsert,
        workspaceId,
      });
    }, authContext);
  }

  private async findRecentTimelineActivities({
    timelineActivityPropertyName,
    workspaceId,
    payloads,
  }: TimelineActivityPayloadWorkspaceIdAndPropertyName) {
    const timelineActivityTypeORMRepository =
      await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        'timelineActivity',
        {
          shouldBypassPermissionChecks: true,
        },
      );

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const whereConditions: Record<string, unknown> = {
      [timelineActivityPropertyName]: In(
        payloads.map((payload) => payload.recordId),
      ),
      name: In(payloads.map((payload) => payload.name)),
      workspaceMemberId: In(
        payloads.map((payload) => payload.workspaceMemberId || null),
      ),
      createdAt: MoreThan(tenMinutesAgo),
    };

    return await timelineActivityTypeORMRepository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: 1,
    });
  }

  public async insertTimelineActivities({
    timelineActivityPropertyName,
    workspaceId,
    payloads,
  }: TimelineActivityPayloadWorkspaceIdAndPropertyName) {
    if (payloads.length === 0) {
      return;
    }

    const timelineActivityTypeORMRepository =
      await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        'timelineActivity',
        {
          shouldBypassPermissionChecks: true,
        },
      );

    return timelineActivityTypeORMRepository.insert(
      payloads.map((payload) => ({
        name: payload.name,
        properties: payload.properties,
        workspaceMemberId: payload.workspaceMemberId,
        [timelineActivityPropertyName]: payload.recordId,
        linkedRecordCachedName: payload.linkedRecordCachedName ?? '',
        linkedRecordId: payload.linkedRecordId,
        linkedObjectMetadataId: payload.linkedObjectMetadataId,
      })),
    );
  }

  private async updateTimelineActivity({
    id,
    properties,
    workspaceMemberId,
    workspaceId,
  }: {
    id: string;
    properties: Partial<ObjectRecord>;
    workspaceMemberId: string | undefined;
    workspaceId: string;
  }) {
    const timelineActivityTypeORMRepository =
      await this.globalWorkspaceOrmManager.getRepository(
        workspaceId,
        'timelineActivity',
        {
          shouldBypassPermissionChecks: true,
        },
      );

    return timelineActivityTypeORMRepository.update(id, {
      properties: properties,
      workspaceMemberId: workspaceMemberId,
    });
  }

  private async getTimelineActivityPropertyName(
    objectSingularName: string,
    workspaceId: string,
  ): Promise<string | undefined> {
    const relationFieldName =
      buildTimelineActivityRelatedMorphFieldMetadataName(objectSingularName);

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const timelineActivityObjectMetadataId = getObjectMetadataIdByName({
      flatObjectMetadataMaps,
      objectName: 'timelineActivity',
    });

    const timelineActivityObjectMetadata = isDefined(
      timelineActivityObjectMetadataId,
    )
      ? findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: timelineActivityObjectMetadataId,
          flatEntityMaps: flatObjectMetadataMaps,
        })
      : undefined;

    // Field metadata is named after the relation (e.g. 'targetIssue'); the
    // 'Id'-suffixed column name only exists as the relation's joinColumnName.
    const relationFieldExistsOnTimelineActivity =
      isDefined(timelineActivityObjectMetadata) &&
      getFlatFieldsFromFlatObjectMetadata(
        timelineActivityObjectMetadata,
        flatFieldMetadataMaps,
      ).some((field) => field.name === relationFieldName);

    return relationFieldExistsOnTimelineActivity
      ? `${relationFieldName}Id`
      : undefined;
  }
}
