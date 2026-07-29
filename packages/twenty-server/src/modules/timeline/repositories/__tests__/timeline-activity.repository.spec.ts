import { Test, type TestingModule } from '@nestjs/testing';

import { createEmptyFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/constant/create-empty-flat-entity-maps.constant';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';

const WORKSPACE_ID = 'workspace-id';
const TIMELINE_ACTIVITY_OBJECT_ID = 'timeline-activity-object-id';
const TIMELINE_ACTIVITY_UNIVERSAL_ID = 'timeline-activity-universal-id';
const TARGET_ISSUE_FIELD_ID = 'target-issue-field-id';
const TARGET_ISSUE_FIELD_UNIVERSAL_ID = 'target-issue-field-universal-id';

const buildFlatEntityMaps = () =>
  createEmptyFlatEntityMaps() as ReturnType<
    typeof createEmptyFlatEntityMaps
  > & {
    byUniversalIdentifier: Record<string, unknown>;
    universalIdentifierById: Record<string, string>;
  };

// Only 'targetIssueId' is wired on timelineActivity, mirroring the real schema
// gap: 'issueComment' has no matching 'targetIssueComment' field.
const buildFlatObjectMetadataMaps = () => {
  const maps = buildFlatEntityMaps();

  maps.byUniversalIdentifier[TIMELINE_ACTIVITY_UNIVERSAL_ID] = {
    id: TIMELINE_ACTIVITY_OBJECT_ID,
    universalIdentifier: TIMELINE_ACTIVITY_UNIVERSAL_ID,
    nameSingular: 'timelineActivity',
    namePlural: 'timelineActivities',
    fieldIds: [TARGET_ISSUE_FIELD_ID],
  };
  maps.universalIdentifierById[TIMELINE_ACTIVITY_OBJECT_ID] =
    TIMELINE_ACTIVITY_UNIVERSAL_ID;

  return maps;
};

// Field metadata is named after the relation ('targetIssue'), not the
// 'Id'-suffixed join column used at the database/ORM layer.
const buildFlatFieldMetadataMaps = () => {
  const maps = buildFlatEntityMaps();

  maps.byUniversalIdentifier[TARGET_ISSUE_FIELD_UNIVERSAL_ID] = {
    id: TARGET_ISSUE_FIELD_ID,
    universalIdentifier: TARGET_ISSUE_FIELD_UNIVERSAL_ID,
    name: 'targetIssue',
  };
  maps.universalIdentifierById[TARGET_ISSUE_FIELD_ID] =
    TARGET_ISSUE_FIELD_UNIVERSAL_ID;

  return maps;
};

describe('TimelineActivityRepository', () => {
  let repository: TimelineActivityRepository;
  let ormManager: jest.Mocked<GlobalWorkspaceOrmManager>;
  let cacheService: jest.Mocked<WorkspaceManyOrAllFlatEntityMapsCacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineActivityRepository,
        {
          provide: GlobalWorkspaceOrmManager,
          useValue: {
            executeInWorkspaceContext: jest.fn(),
            getRepository: jest.fn(),
          },
        },
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: {
            getOrRecomputeManyOrAllFlatEntityMaps: jest.fn().mockResolvedValue({
              flatObjectMetadataMaps: buildFlatObjectMetadataMaps(),
              flatFieldMetadataMaps: buildFlatFieldMetadataMaps(),
              // oxlint-disable-next-line @typescript-eslint/no-explicit-any
            } as any),
          },
        },
      ],
    }).compile();

    repository = module.get(TimelineActivityRepository);
    ormManager = module.get(GlobalWorkspaceOrmManager);
    cacheService = module.get(WorkspaceManyOrAllFlatEntityMapsCacheService);
  });

  it('skips without querying the database when timelineActivity has no matching target field', async () => {
    await repository.upsertTimelineActivities({
      objectSingularName: 'issueComment',
      workspaceId: WORKSPACE_ID,
      payloads: [
        {
          name: 'issueComment.created',
          recordId: 'comment-id',
          workspaceMemberId: 'member-id',
          properties: {},
        },
      ],
    });

    expect(
      cacheService.getOrRecomputeManyOrAllFlatEntityMaps,
    ).toHaveBeenCalled();
    expect(ormManager.executeInWorkspaceContext).not.toHaveBeenCalled();
  });

  it('proceeds when timelineActivity has a matching target field', async () => {
    ormManager.executeInWorkspaceContext.mockImplementation(async (callback) =>
      callback(),
    );

    const find = jest.fn().mockResolvedValue([]);
    const insert = jest.fn().mockResolvedValue(undefined);

    ormManager.getRepository.mockResolvedValue({ find, insert } as never);

    await repository.upsertTimelineActivities({
      objectSingularName: 'issue',
      workspaceId: WORKSPACE_ID,
      payloads: [
        {
          name: 'issue.created',
          recordId: 'issue-id',
          workspaceMemberId: 'member-id',
          properties: {},
        },
      ],
    });

    expect(ormManager.executeInWorkspaceContext).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ targetIssueId: 'issue-id' }),
    ]);
  });
});
