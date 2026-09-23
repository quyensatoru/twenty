import { type TimelineActivityTypeSnapshot } from 'twenty-shared/timeline';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { type WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';

const WORKSPACE_ID = '20202020-0000-4000-8000-000000000001';
const RECORD_ID = '20202020-0000-4000-8000-000000000002';
const WORKSPACE_MEMBER_ID = '20202020-0000-4000-8000-000000000003';
const TIMELINE_ACTIVITY_TYPE_ID = '20202020-0000-4000-8000-000000000004';
const TIMELINE_ACTIVITY_TYPE_SNAPSHOT: TimelineActivityTypeSnapshot = {
  id: TIMELINE_ACTIVITY_TYPE_ID,
  universalIdentifier: '20202020-0000-4000-8000-000000000005',
  name: 'recordUpdated',
  label: 'was updated by',
  action: 'updated',
  icon: 'IconPencil',
  objectUniversalIdentifier: null,
  frontComponentUniversalIdentifier: null,
};

const TIMELINE_ACTIVITY_OBJECT_ID = 'timeline-activity-object-id';
const TIMELINE_ACTIVITY_UNIVERSAL_ID = 'timeline-activity-universal-id';
const TARGET_PERSON_FIELD_ID = 'target-person-field-id';
const TARGET_PERSON_FIELD_UNIVERSAL_ID = 'target-person-field-universal-id';

const buildFlatEntityMaps = () =>
  createEmptyFlatEntityMaps() as ReturnType<
    typeof createEmptyFlatEntityMaps
  > & {
    byUniversalIdentifier: Record<string, unknown>;
    universalIdentifierById: Record<string, string>;
  };

// Only 'targetPersonId' is wired on timelineActivity, mirroring the real schema
// gap: a freshly added custom standard object has no matching 'target<Object>'
// field yet.
const buildFlatObjectMetadataMapsWithTargetPerson = () => {
  const maps = buildFlatEntityMaps();

  maps.byUniversalIdentifier[TIMELINE_ACTIVITY_UNIVERSAL_ID] = {
    id: TIMELINE_ACTIVITY_OBJECT_ID,
    universalIdentifier: TIMELINE_ACTIVITY_UNIVERSAL_ID,
    nameSingular: 'timelineActivity',
    namePlural: 'timelineActivities',
    fieldIds: [TARGET_PERSON_FIELD_ID],
  };
  maps.universalIdentifierById[TIMELINE_ACTIVITY_OBJECT_ID] =
    TIMELINE_ACTIVITY_UNIVERSAL_ID;

  return maps;
};

// Field metadata is named after the relation ('targetPerson'), not the
// 'Id'-suffixed join column used at the database/ORM layer.
const buildFlatFieldMetadataMapsWithTargetPerson = () => {
  const maps = buildFlatEntityMaps();

  maps.byUniversalIdentifier[TARGET_PERSON_FIELD_UNIVERSAL_ID] = {
    id: TARGET_PERSON_FIELD_ID,
    universalIdentifier: TARGET_PERSON_FIELD_UNIVERSAL_ID,
    name: 'targetPerson',
  };
  maps.universalIdentifierById[TARGET_PERSON_FIELD_ID] =
    TARGET_PERSON_FIELD_UNIVERSAL_ID;

  return maps;
};

const buildCacheServiceWithTargetPerson = () =>
  ({
    getOrRecomputeManyOrAllFlatEntityMaps: jest.fn().mockResolvedValue({
      flatObjectMetadataMaps: buildFlatObjectMetadataMapsWithTargetPerson(),
      flatFieldMetadataMaps: buildFlatFieldMetadataMapsWithTargetPerson(),
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
  }) as unknown as WorkspaceManyOrAllFlatEntityMapsCacheService;

const buildCacheServiceWithoutMatchingTargetField = () =>
  ({
    getOrRecomputeManyOrAllFlatEntityMaps: jest.fn().mockResolvedValue({
      flatObjectMetadataMaps: buildFlatObjectMetadataMapsWithTargetPerson(),
      flatFieldMetadataMaps: buildFlatEntityMaps(),
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    } as any),
  }) as unknown as WorkspaceManyOrAllFlatEntityMapsCacheService;

describe('TimelineActivityRepository', () => {
  it('merges and stamps a recent row written without a snapshot', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn().mockResolvedValue(undefined);
    const workspaceRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: '20202020-0000-4000-8000-000000000006',
          targetPersonId: RECORD_ID,
          workspaceMemberId: WORKSPACE_MEMBER_ID,
          timelineActivityTypeId: TIMELINE_ACTIVITY_TYPE_ID,
          timelineActivityTypeSnapshot: null,
          linkedRecordId: null,
          properties: {
            diff: { name: { before: 'Before', after: 'First' } },
          },
        },
      ]),
      update,
      insert,
    };
    const workspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(
        async (callback: () => Promise<void>) => callback(),
      ),
      runInWorkspaceTransaction: jest.fn(
        async (
          callback: (transactionScope: {
            getRepository: () => typeof workspaceRepository;
            executeRawQuery: () => Promise<never[]>;
          }) => Promise<void>,
        ) =>
          callback({
            getRepository: () => workspaceRepository,
            executeRawQuery: jest.fn().mockResolvedValue([]),
          }),
      ),
    } as unknown as WorkspaceOrmManager;
    const repository = new TimelineActivityRepository(
      workspaceOrmManager,
      buildCacheServiceWithTargetPerson(),
    );

    await repository.upsertTimelineActivities({
      objectSingularName: 'person',
      workspaceId: WORKSPACE_ID,
      payloads: [
        {
          happensAt: new Date('2026-08-23T09:00:00.000Z'),
          properties: {
            diff: { name: { before: 'First', after: 'Second' } },
          },
          recordId: RECORD_ID,
          workspaceMemberId: WORKSPACE_MEMBER_ID,
          timelineActivityTypeId: TIMELINE_ACTIVITY_TYPE_ID,
          timelineActivityTypeSnapshot: TIMELINE_ACTIVITY_TYPE_SNAPSHOT,
        },
      ],
    });

    expect(insert).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      '20202020-0000-4000-8000-000000000006',
      {
        properties: {
          diff: { name: { before: 'Before', after: 'Second' } },
        },
        workspaceMemberId: WORKSPACE_MEMBER_ID,
        timelineActivityTypeSnapshot: TIMELINE_ACTIVITY_TYPE_SNAPSHOT,
      },
    );
  });

  it('locks merge identities in a stable order before reading recent rows', async () => {
    const executeRawQuery = jest.fn().mockResolvedValue([]);
    const workspaceRepository = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockResolvedValue(undefined),
    };
    const workspaceOrmManager = {
      executeInWorkspaceContext: jest.fn(
        async (callback: () => Promise<void>) => callback(),
      ),
      runInWorkspaceTransaction: jest.fn(
        async (
          callback: (transactionScope: {
            getRepository: () => typeof workspaceRepository;
            executeRawQuery: typeof executeRawQuery;
          }) => Promise<void>,
        ) =>
          callback({
            getRepository: () => workspaceRepository,
            executeRawQuery,
          }),
      ),
    } as unknown as WorkspaceOrmManager;
    const repository = new TimelineActivityRepository(
      workspaceOrmManager,
      buildCacheServiceWithTargetPerson(),
    );

    await repository.upsertTimelineActivities({
      objectSingularName: 'person',
      workspaceId: WORKSPACE_ID,
      payloads: [
        {
          happensAt: new Date('2026-08-23T09:00:00.000Z'),
          properties: {},
          recordId: 'record-z',
          workspaceMemberId: WORKSPACE_MEMBER_ID,
          timelineActivityTypeId: TIMELINE_ACTIVITY_TYPE_ID,
          timelineActivityTypeSnapshot: TIMELINE_ACTIVITY_TYPE_SNAPSHOT,
        },
        {
          happensAt: new Date('2026-08-23T09:00:00.000Z'),
          properties: {},
          recordId: 'record-a',
          workspaceMemberId: WORKSPACE_MEMBER_ID,
          timelineActivityTypeId: TIMELINE_ACTIVITY_TYPE_ID,
          timelineActivityTypeSnapshot: TIMELINE_ACTIVITY_TYPE_SNAPSHOT,
        },
      ],
    });

    const lockStatement = `SELECT pg_advisory_xact_lock(hashtextextended("lockName", 0))
   FROM unnest($1::text[]) WITH ORDINALITY AS "locks"("lockName", "ordinality")
   ORDER BY "ordinality"`;

    expect(executeRawQuery).toHaveBeenCalledTimes(1);
    expect(executeRawQuery).toHaveBeenCalledWith(lockStatement, [
      [
        JSON.stringify([
          'timeline-activity-merge',
          WORKSPACE_ID,
          'person',
          'record-a',
          WORKSPACE_MEMBER_ID,
          TIMELINE_ACTIVITY_TYPE_ID,
        ]),
        JSON.stringify([
          'timeline-activity-merge',
          WORKSPACE_ID,
          'person',
          'record-z',
          WORKSPACE_MEMBER_ID,
          TIMELINE_ACTIVITY_TYPE_ID,
        ]),
      ],
    ]);
    expect(
      workspaceRepository.find.mock.invocationCallOrder[0],
    ).toBeGreaterThan(executeRawQuery.mock.invocationCallOrder[0]);
  });

  it('skips without opening a transaction when timelineActivity has no matching target field', async () => {
    const executeInWorkspaceContext = jest.fn();
    const workspaceOrmManager = {
      executeInWorkspaceContext,
      runInWorkspaceTransaction: jest.fn(),
    } as unknown as WorkspaceOrmManager;
    const cacheService = buildCacheServiceWithoutMatchingTargetField();
    const repository = new TimelineActivityRepository(
      workspaceOrmManager,
      cacheService,
    );

    await repository.upsertTimelineActivities({
      objectSingularName: 'issueComment',
      workspaceId: WORKSPACE_ID,
      payloads: [
        {
          happensAt: new Date('2026-08-23T09:00:00.000Z'),
          properties: {},
          recordId: 'comment-id',
          workspaceMemberId: WORKSPACE_MEMBER_ID,
          timelineActivityTypeId: TIMELINE_ACTIVITY_TYPE_ID,
          timelineActivityTypeSnapshot: TIMELINE_ACTIVITY_TYPE_SNAPSHOT,
        },
      ],
    });

    expect(
      cacheService.getOrRecomputeManyOrAllFlatEntityMaps,
    ).toHaveBeenCalled();
    expect(executeInWorkspaceContext).not.toHaveBeenCalled();
  });
});
