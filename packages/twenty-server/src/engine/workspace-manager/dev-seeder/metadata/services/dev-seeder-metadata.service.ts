import { Injectable } from '@nestjs/common';

import { FieldMetadataType, RelationType, ViewType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildObjectIdByNameMaps } from 'src/engine/metadata-modules/flat-object-metadata/utils/build-object-id-by-name-maps.util';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { ViewFieldService } from 'src/engine/metadata-modules/view-field/services/view-field.service';
import { ViewService } from 'src/engine/metadata-modules/view/services/view.service';
import {
  SEED_APPLE_WORKSPACE_ID,
  SEED_YCOMBINATOR_WORKSPACE_ID,
} from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { COMPANY_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/company-custom-field-seeds.constant';
import { EPIC_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/epic-custom-field-seeds.constant';
import { ISSUE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/issue-custom-field-seeds.constant';
import { PERSON_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/person-custom-field-seeds.constant';
import { PET_CARE_AGREEMENT_CARETAKER_MORPH_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/pet-care-agreement-custom-relation-field-seeds.constant';
import { PET_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/pet-custom-field-seeds.constant';
import { PET_CUSTOM_RELATION_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/pet-custom-relation-field-seeds.constant';
import { PROJECT_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/project-custom-field-seeds.constant';
import { PROJECT_MEMBER_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/project-member-custom-field-seeds.constant';
import { SPRINT_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/sprint-custom-field-seeds.constant';
import { SURVEY_RESULT_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/survey-results-field-seeds.constant';
import { TIME_LOG_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/time-log-custom-field-seeds.constant';
import { EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/employment-history-custom-object-seed.constant';
import { EPIC_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/epic-custom-object-seed.constant';
import { ISSUE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/issue-custom-object-seed.constant';
import { PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/pet-care-agreement-custom-object-seed.constant';
import { PET_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/pet-custom-object-seed.constant';
import { PROJECT_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/project-custom-object-seed.constant';
import { PROJECT_MEMBER_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/project-member-custom-object-seed.constant';
import { ROCKET_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/rocket-custom-object-seed.constant';
import { SPRINT_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/sprint-custom-object-seed.constant';
import { TIME_LOG_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/time-log-custom-object-seed.constant';
import { SURVEY_RESULT_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/survey-results-object-seed.constant';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

type MorphRelationSeed = FieldMetadataSeed & {
  targetObjectMetadataNames: string[];
};

type JunctionFieldSeed = {
  sourceObjectName: string;
  name: string;
  label: string;
  icon: string;
  targetObjectName: string;
  targetFieldLabel: string;
  targetFieldIcon: string;
};

type JunctionConfigSeed = {
  objectName: string;
  fieldName: string;
  junctionTargetFieldRef: string;
  label?: string;
};

type RelationFieldSeed = {
  sourceObjectName: string;
  name: string;
  label: string;
  icon: string;
  relationType: RelationType;
  targetObjectName: string;
  targetFieldLabel: string;
  targetFieldIcon: string;
};

type KanbanViewSeed = {
  objectName: string;
  name: string;
  icon: string;
  mainGroupByFieldName: string;
  visibleFieldNames?: string[];
};

type WorkspaceSeedConfig = {
  objects: { seed: ObjectMetadataSeed; fields?: FieldMetadataSeed[] }[];
  fields: { objectName: string; seeds: FieldMetadataSeed[] }[];
  morphRelations?: { objectName: string; seeds: MorphRelationSeed[] }[];
  junctionFields?: JunctionFieldSeed[];
  junctionConfigs?: JunctionConfigSeed[];
  relations?: RelationFieldSeed[];
  kanbanViews?: KanbanViewSeed[];
};

type FlatMaps = {
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  objectIdByName: Record<string, string>;
};

@Injectable()
export class DevSeederMetadataService {
  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly viewService: ViewService,
    private readonly viewFieldService: ViewFieldService,
  ) {}

  private readonly workspaceConfigs: Record<string, WorkspaceSeedConfig> = {
    [SEED_APPLE_WORKSPACE_ID]: {
      objects: [
        { seed: ROCKET_CUSTOM_OBJECT_SEED },
        { seed: PET_CUSTOM_OBJECT_SEED, fields: PET_CUSTOM_FIELD_SEEDS },
        {
          seed: SURVEY_RESULT_CUSTOM_OBJECT_SEED,
          fields: SURVEY_RESULT_CUSTOM_FIELD_SEEDS,
        },
        // Junction objects (minimal pivots)
        { seed: EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED },
        { seed: PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED },
        // Jira-style task manager
        {
          seed: PROJECT_CUSTOM_OBJECT_SEED,
          fields: PROJECT_CUSTOM_FIELD_SEEDS,
        },
        {
          seed: PROJECT_MEMBER_CUSTOM_OBJECT_SEED,
          fields: PROJECT_MEMBER_CUSTOM_FIELD_SEEDS,
        },
        { seed: ISSUE_CUSTOM_OBJECT_SEED, fields: ISSUE_CUSTOM_FIELD_SEEDS },
        { seed: EPIC_CUSTOM_OBJECT_SEED, fields: EPIC_CUSTOM_FIELD_SEEDS },
        { seed: SPRINT_CUSTOM_OBJECT_SEED, fields: SPRINT_CUSTOM_FIELD_SEEDS },
        {
          seed: TIME_LOG_CUSTOM_OBJECT_SEED,
          fields: TIME_LOG_CUSTOM_FIELD_SEEDS,
        },
      ],
      fields: [
        { objectName: 'company', seeds: COMPANY_CUSTOM_FIELD_SEEDS },
        { objectName: 'person', seeds: PERSON_CUSTOM_FIELD_SEEDS },
      ],
      morphRelations: [
        {
          objectName: PET_CUSTOM_OBJECT_SEED.nameSingular,
          seeds: PET_CUSTOM_RELATION_FIELD_SEEDS,
        },
        {
          objectName: PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED.nameSingular,
          seeds: [PET_CARE_AGREEMENT_CARETAKER_MORPH_SEED],
        },
      ],
      junctionFields: [
        // Employment History: Person <-> Company
        {
          sourceObjectName: 'person',
          name: 'previousCompanies',
          label: 'Previous Companies',
          icon: 'IconBuildingSkyscraper',
          targetObjectName: EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Person',
          targetFieldIcon: 'IconUser',
        },
        {
          sourceObjectName: 'company',
          name: 'previousEmployees',
          label: 'Previous Employees',
          icon: 'IconUser',
          targetObjectName: EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Company',
          targetFieldIcon: 'IconBuildingSkyscraper',
        },
        // Pet Care Agreement: Pet -> caretakers
        {
          sourceObjectName: PET_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'caretakers',
          label: 'Caretakers',
          icon: 'IconUser',
          targetObjectName: PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Pet',
          targetFieldIcon: 'IconCat',
        },
        // Project Member: Project <-> Workspace Member
        {
          sourceObjectName: PROJECT_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'members',
          label: 'Members',
          icon: 'IconUsers',
          targetObjectName: PROJECT_MEMBER_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Project',
          targetFieldIcon: 'IconLayoutKanban',
        },
        {
          sourceObjectName: 'workspaceMember',
          name: 'projects',
          label: 'Projects',
          icon: 'IconLayoutKanban',
          targetObjectName: PROJECT_MEMBER_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Workspace Member',
          targetFieldIcon: 'IconUser',
        },
      ],
      junctionConfigs: [
        // Employment History junction configs
        {
          objectName: 'person',
          fieldName: 'previousCompanies',
          junctionTargetFieldRef: `${EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED.nameSingular}.company`,
        },
        {
          objectName: 'company',
          fieldName: 'previousEmployees',
          junctionTargetFieldRef: `${EMPLOYMENT_HISTORY_CUSTOM_OBJECT_SEED.nameSingular}.person`,
        },
        // Pet Care Agreement junction configs
        {
          objectName: PET_CUSTOM_OBJECT_SEED.nameSingular,
          fieldName: 'caretakers',
          junctionTargetFieldRef: `${PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED.nameSingular}.caretakerPerson`,
        },
        {
          objectName: 'company',
          fieldName: 'caredForPets',
          junctionTargetFieldRef: `${PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED.nameSingular}.pet`,
        },
        {
          objectName: 'person',
          fieldName: 'caredForPets',
          junctionTargetFieldRef: `${PET_CARE_AGREEMENT_CUSTOM_OBJECT_SEED.nameSingular}.pet`,
        },
        // Project Member junction configs
        {
          objectName: PROJECT_CUSTOM_OBJECT_SEED.nameSingular,
          fieldName: 'members',
          junctionTargetFieldRef: `${PROJECT_MEMBER_CUSTOM_OBJECT_SEED.nameSingular}.workspaceMember`,
        },
        {
          objectName: 'workspaceMember',
          fieldName: 'projects',
          junctionTargetFieldRef: `${PROJECT_MEMBER_CUSTOM_OBJECT_SEED.nameSingular}.project`,
        },
      ],
      relations: [
        {
          sourceObjectName: PROJECT_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'lead',
          label: 'Lead',
          icon: 'IconUser',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: 'workspaceMember',
          targetFieldLabel: 'Led Projects',
          targetFieldIcon: 'IconLayoutKanban',
        },
        {
          sourceObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'project',
          label: 'Project',
          icon: 'IconLayoutKanban',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: PROJECT_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Issues',
          targetFieldIcon: 'IconListCheck',
        },
        {
          sourceObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'assignee',
          label: 'Assignee',
          icon: 'IconUser',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: 'workspaceMember',
          targetFieldLabel: 'Assigned Issues',
          targetFieldIcon: 'IconListCheck',
        },
        {
          sourceObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'reporter',
          label: 'Reporter',
          icon: 'IconUser',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: 'workspaceMember',
          targetFieldLabel: 'Reported Issues',
          targetFieldIcon: 'IconListCheck',
        },
        {
          sourceObjectName: EPIC_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'project',
          label: 'Project',
          icon: 'IconLayoutKanban',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: PROJECT_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Epics',
          targetFieldIcon: 'IconFlag',
        },
        {
          sourceObjectName: SPRINT_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'project',
          label: 'Project',
          icon: 'IconLayoutKanban',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: PROJECT_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Sprints',
          targetFieldIcon: 'IconRun',
        },
        {
          sourceObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'epic',
          label: 'Epic',
          icon: 'IconFlag',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: EPIC_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Issues',
          targetFieldIcon: 'IconListCheck',
        },
        {
          sourceObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'sprint',
          label: 'Sprint',
          icon: 'IconRun',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: SPRINT_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Issues',
          targetFieldIcon: 'IconListCheck',
        },
        {
          sourceObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'parentIssue',
          label: 'Parent Issue',
          icon: 'IconArrowBackUp',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Sub-issues',
          targetFieldIcon: 'IconListCheck',
        },
        {
          sourceObjectName: TIME_LOG_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'issue',
          label: 'Issue',
          icon: 'IconListCheck',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          targetFieldLabel: 'Time Logs',
          targetFieldIcon: 'IconClock',
        },
        {
          sourceObjectName: TIME_LOG_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'member',
          label: 'Member',
          icon: 'IconUser',
          relationType: RelationType.MANY_TO_ONE,
          targetObjectName: 'workspaceMember',
          targetFieldLabel: 'Time Logs',
          targetFieldIcon: 'IconClock',
        },
      ],
      kanbanViews: [
        {
          objectName: ISSUE_CUSTOM_OBJECT_SEED.nameSingular,
          name: 'Board',
          icon: 'IconLayoutKanban',
          mainGroupByFieldName: 'status',
          visibleFieldNames: ['priority', 'assignee', 'storyPoints'],
        },
      ],
    },
    [SEED_YCOMBINATOR_WORKSPACE_ID]: {
      objects: [
        {
          seed: SURVEY_RESULT_CUSTOM_OBJECT_SEED,
          fields: SURVEY_RESULT_CUSTOM_FIELD_SEEDS,
        },
      ],
      fields: [
        { objectName: 'company', seeds: COMPANY_CUSTOM_FIELD_SEEDS },
        { objectName: 'person', seeds: PERSON_CUSTOM_FIELD_SEEDS },
      ],
    },
  };

  private getLightConfig(_config: WorkspaceSeedConfig): WorkspaceSeedConfig {
    return {
      objects: [],
      fields: [],
    };
  }

  private getConfig(workspaceId: string, light: boolean): WorkspaceSeedConfig {
    const config = this.workspaceConfigs[workspaceId];

    if (!config) {
      throw new Error(
        `Workspace configuration not found for workspaceId: ${workspaceId}`,
      );
    }

    return light ? this.getLightConfig(config) : config;
  }

  public async seed({
    workspaceId,
    light = false,
  }: {
    workspaceId: string;
    light?: boolean;
  }) {
    const config = this.getConfig(workspaceId, light);

    for (const obj of config.objects) {
      await this.seedCustomObject({
        workspaceId,
        objectMetadataSeed: obj.seed,
      });

      if (obj.fields) {
        await this.seedCustomFields({
          workspaceId,
          objectMetadataNameSingular: obj.seed.nameSingular,
          fieldMetadataSeeds: obj.fields,
        });
      }
    }

    for (const fieldConfig of config.fields) {
      await this.seedCustomFields({
        workspaceId,
        objectMetadataNameSingular: fieldConfig.objectName,
        fieldMetadataSeeds: fieldConfig.seeds,
      });
    }
  }

  private async seedCustomObject({
    workspaceId,
    objectMetadataSeed,
  }: {
    workspaceId: string;
    objectMetadataSeed: ObjectMetadataSeed;
  }): Promise<void> {
    await this.objectMetadataService.createOneObject({
      createObjectInput: objectMetadataSeed,
      workspaceId,
    });
  }

  private async seedCustomFields({
    workspaceId,
    objectMetadataNameSingular,
    fieldMetadataSeeds,
  }: {
    workspaceId: string;
    objectMetadataNameSingular: string;
    fieldMetadataSeeds: FieldMetadataSeed[];
  }): Promise<void> {
    const objectMetadata =
      await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
        where: { nameSingular: objectMetadataNameSingular },
      });

    if (!isDefined(objectMetadata)) {
      throw new Error(
        `Object metadata not found for: ${objectMetadataNameSingular}`,
      );
    }
    const createFieldInputs = fieldMetadataSeeds.map((fieldMetadataSeed) => ({
      ...fieldMetadataSeed,
      objectMetadataId: objectMetadata.id,
    }));

    await this.fieldMetadataService.createManyFields({
      createFieldInputs,
      workspaceId,
    });
  }

  public async seedRelations({
    workspaceId,
    light = false,
  }: {
    workspaceId: string;
    light?: boolean;
  }) {
    const config = this.getConfig(workspaceId, light);

    // 1. Seed morph relations (creates inverses on target objects)
    let maps = await this.getFreshFlatMaps(workspaceId);

    for (const relation of config.morphRelations ?? []) {
      await this.seedMorphRelations({
        workspaceId,
        relation,
        objectIdByNameSingular: maps.objectIdByName,
      });
    }

    // 2. Seed plain single-target relations (creates inverses on target objects)
    maps = await this.getFreshFlatMaps(workspaceId);

    for (const relation of config.relations ?? []) {
      await this.seedRelationField({ workspaceId, relation, flatMaps: maps });
    }

    // 3. Seed junction fields (creates relations + inverses on junction objects)
    maps = await this.getFreshFlatMaps(workspaceId);

    for (const field of config.junctionFields ?? []) {
      await this.seedJunctionField({ workspaceId, field, flatMaps: maps });
    }

    // 4. Configure junction settings (after all fields exist)
    if (config.junctionConfigs && config.junctionConfigs.length > 0) {
      maps = await this.getFreshFlatMaps(workspaceId);

      for (const junctionConfig of config.junctionConfigs) {
        await this.applyJunctionConfig({
          workspaceId,
          junctionConfig,
          flatMaps: maps,
        });
      }
    }
  }

  public async seedViews({
    workspaceId,
    light = false,
  }: {
    workspaceId: string;
    light?: boolean;
  }) {
    const config = this.getConfig(workspaceId, light);
    const maps = await this.getFreshFlatMaps(workspaceId);

    for (const kanbanView of config.kanbanViews ?? []) {
      await this.seedKanbanView({
        workspaceId,
        kanbanView,
        flatMaps: maps,
        config,
      });
    }
  }

  private async seedKanbanView({
    workspaceId,
    kanbanView,
    flatMaps,
    config,
  }: {
    workspaceId: string;
    kanbanView: KanbanViewSeed;
    flatMaps: FlatMaps;
    config: WorkspaceSeedConfig;
  }): Promise<void> {
    const objectMetadataId = flatMaps.objectIdByName[kanbanView.objectName];

    if (!isDefined(objectMetadataId)) {
      throw new Error(`Object not found: ${kanbanView.objectName}`);
    }

    const mainGroupByFieldMetadataId = this.findFieldId(
      kanbanView.objectName,
      kanbanView.mainGroupByFieldName,
      flatMaps,
    );

    const createdView = await this.viewService.createOne({
      createViewInput: {
        name: kanbanView.name,
        icon: kanbanView.icon,
        objectMetadataId,
        type: ViewType.KANBAN,
        mainGroupByFieldMetadataId,
      },
      workspaceId,
    });

    // A UI-created view always gets a ViewField for every object field (visible
    // or hidden) — mirror that here, otherwise the board's "reveal hidden field"
    // action crashes on an empty field list (no field to anchor the new position to).
    const objectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectMetadataId,
      flatEntityMaps: flatMaps.flatObjectMetadataMaps,
    });

    if (!isDefined(objectMetadata)) {
      throw new Error(`Object metadata not found: ${kanbanView.objectName}`);
    }

    const visibleFieldNames = new Set(kanbanView.visibleFieldNames ?? []);

    // The label identifier field (e.g. "Name") is always shown as the card/row
    // title and can't have a ViewField of its own — creating one is rejected.
    const fieldIdsExcludingLabelIdentifier = objectMetadata.fieldIds.filter(
      (fieldMetadataId) =>
        fieldMetadataId !== objectMetadata.labelIdentifierFieldMetadataId,
    );

    // objectMetadata.fieldIds reflects raw DB fetch order, not creation order
    // (no ORDER BY anywhere in that path), so custom fields end up scrambled
    // with system/relation fields. Reorder using the seed config itself: caller
    // declared scalar fields first, then declared relations, in the order the
    // seed lists them; anything else (system fields, standard relations,
    // reverse relations) keeps its existing relative order at the end.
    const declaredFieldNameOrder = [
      ...(config.objects.find(
        (objectConfig) =>
          objectConfig.seed.nameSingular === kanbanView.objectName,
      )?.fields ?? []
      ).map((field) => field.name),
      ...(config.relations ?? [])
        .filter(
          (relation) => relation.sourceObjectName === kanbanView.objectName,
        )
        .map((relation) => relation.name),
    ];

    const fieldNameById = new Map(
      fieldIdsExcludingLabelIdentifier.map((fieldMetadataId) => [
        fieldMetadataId,
        findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: fieldMetadataId,
          flatEntityMaps: flatMaps.flatFieldMetadataMaps,
        })?.name,
      ]),
    );

    const orderedFieldIds = [...fieldIdsExcludingLabelIdentifier].sort(
      (fieldMetadataIdA, fieldMetadataIdB) => {
        const rankA = declaredFieldNameOrder.indexOf(
          fieldNameById.get(fieldMetadataIdA) ?? '',
        );
        const rankB = declaredFieldNameOrder.indexOf(
          fieldNameById.get(fieldMetadataIdB) ?? '',
        );

        if (rankA === -1 && rankB === -1) return 0;
        if (rankA === -1) return 1;
        if (rankB === -1) return -1;

        return rankA - rankB;
      },
    );

    await this.viewFieldService.createMany({
      workspaceId,
      createViewFieldInputs: orderedFieldIds.map(
        (fieldMetadataId, position) => {
          const field = findFlatEntityByIdInFlatEntityMaps({
            flatEntityId: fieldMetadataId,
            flatEntityMaps: flatMaps.flatFieldMetadataMaps,
          });

          return {
            fieldMetadataId,
            viewId: createdView.id,
            isVisible: isDefined(field) && visibleFieldNames.has(field.name),
            position,
          };
        },
      ),
    });
  }

  private async getFreshFlatMaps(workspaceId: string): Promise<FlatMaps> {
    await this.flatEntityMapsCacheService.invalidateFlatEntityMaps({
      workspaceId,
      flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
    });

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const { idByNameSingular } = buildObjectIdByNameMaps(
      flatObjectMetadataMaps,
    );

    return {
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
      objectIdByName: idByNameSingular,
    };
  }

  private async applyJunctionConfig({
    workspaceId,
    junctionConfig,
    flatMaps,
  }: {
    workspaceId: string;
    junctionConfig: JunctionConfigSeed;
    flatMaps: FlatMaps;
  }): Promise<void> {
    const [targetObjectName, targetFieldName] =
      junctionConfig.junctionTargetFieldRef.split('.');

    const junctionTargetFieldId = this.findFieldId(
      targetObjectName,
      targetFieldName,
      flatMaps,
    );

    const fieldId = this.findFieldId(
      junctionConfig.objectName,
      junctionConfig.fieldName,
      flatMaps,
    );

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      updateFieldInput: {
        id: fieldId,
        ...(junctionConfig.label && { label: junctionConfig.label }),
        settings: {
          relationType: RelationType.ONE_TO_MANY,
          junctionTargetFieldId,
        },
      },
    });
  }

  private async seedMorphRelations({
    workspaceId,
    relation,
    objectIdByNameSingular,
  }: {
    workspaceId: string;
    relation: {
      objectName: string;
      seeds: MorphRelationSeed[];
    };
    objectIdByNameSingular: Record<string, string>;
  }): Promise<void> {
    const objectMetadataId = objectIdByNameSingular[relation.objectName];

    if (!isDefined(objectMetadataId)) {
      throw new Error(
        `Object metadata id not found for: ${relation.objectName}`,
      );
    }

    const createFieldInputs = relation.seeds.map((seed) => ({
      type: seed.type,
      label: seed.label,
      name: seed.name,
      icon: seed.icon,
      objectMetadataId,
      morphRelationsCreationPayload: seed.targetObjectMetadataNames.map(
        (targetObjectMetadataName) => {
          const targetObjectMetadataId =
            objectIdByNameSingular[targetObjectMetadataName];

          if (!isDefined(targetObjectMetadataId)) {
            throw new Error(
              `Target object metadata id not found for: ${targetObjectMetadataName}`,
            );
          }

          if (!isDefined(seed.morphRelationsCreationPayload)) {
            throw new Error('Morph relations creation payload is not defined');
          }

          return {
            type: seed.morphRelationsCreationPayload[0].type,
            targetFieldLabel:
              seed.morphRelationsCreationPayload[0].targetFieldLabel,
            targetFieldIcon:
              seed.morphRelationsCreationPayload[0].targetFieldIcon,
            targetObjectMetadataId,
          };
        },
      ),
    }));

    await this.fieldMetadataService.createManyFields({
      createFieldInputs,
      workspaceId,
    });
  }

  private async seedRelationField({
    workspaceId,
    relation,
    flatMaps,
  }: {
    workspaceId: string;
    relation: RelationFieldSeed;
    flatMaps: FlatMaps;
  }): Promise<void> {
    const sourceObjectId = flatMaps.objectIdByName[relation.sourceObjectName];
    const targetObjectId = flatMaps.objectIdByName[relation.targetObjectName];

    if (!isDefined(sourceObjectId)) {
      throw new Error(`Source object not found: ${relation.sourceObjectName}`);
    }
    if (!isDefined(targetObjectId)) {
      throw new Error(`Target object not found: ${relation.targetObjectName}`);
    }

    await this.fieldMetadataService.createManyFields({
      createFieldInputs: [
        {
          type: FieldMetadataType.RELATION,
          name: relation.name,
          label: relation.label,
          icon: relation.icon,
          objectMetadataId: sourceObjectId,
          relationCreationPayload: {
            type: relation.relationType,
            targetFieldLabel: relation.targetFieldLabel,
            targetFieldIcon: relation.targetFieldIcon,
            targetObjectMetadataId: targetObjectId,
          },
        },
      ],
      workspaceId,
    });
  }

  private async seedJunctionField({
    workspaceId,
    field,
    flatMaps,
  }: {
    workspaceId: string;
    field: JunctionFieldSeed;
    flatMaps: FlatMaps;
  }): Promise<void> {
    const sourceObjectId = flatMaps.objectIdByName[field.sourceObjectName];
    const targetObjectId = flatMaps.objectIdByName[field.targetObjectName];

    if (!isDefined(sourceObjectId)) {
      throw new Error(`Source object not found: ${field.sourceObjectName}`);
    }
    if (!isDefined(targetObjectId)) {
      throw new Error(`Target object not found: ${field.targetObjectName}`);
    }

    await this.fieldMetadataService.createManyFields({
      createFieldInputs: [
        {
          type: FieldMetadataType.RELATION,
          name: field.name,
          label: field.label,
          icon: field.icon,
          objectMetadataId: sourceObjectId,
          relationCreationPayload: {
            type: RelationType.ONE_TO_MANY,
            targetFieldLabel: field.targetFieldLabel,
            targetFieldIcon: field.targetFieldIcon,
            targetObjectMetadataId: targetObjectId,
          },
        },
      ],
      workspaceId,
    });
  }

  private findFieldId(
    objectName: string,
    fieldName: string,
    flatMaps: FlatMaps,
  ): string {
    const objectId = flatMaps.objectIdByName[objectName];

    if (!isDefined(objectId)) {
      throw new Error(`Object not found: ${objectName}`);
    }

    const objectMetadata = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: objectId,
      flatEntityMaps: flatMaps.flatObjectMetadataMaps,
    });

    if (!isDefined(objectMetadata)) {
      throw new Error(`Object metadata not found: ${objectName}`);
    }

    for (const fieldId of objectMetadata.fieldIds) {
      const field = findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: fieldId,
        flatEntityMaps: flatMaps.flatFieldMetadataMaps,
      });

      if (field?.name === fieldName) {
        return fieldId;
      }
    }

    throw new Error(`Field not found: ${objectName}.${fieldName}`);
  }
}
