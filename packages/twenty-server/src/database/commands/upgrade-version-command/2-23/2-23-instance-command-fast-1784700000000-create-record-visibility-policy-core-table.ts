import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.23.0', 1784700000000)
export class CreateRecordVisibilityPolicyCoreTableFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."recordVisibilityPolicy" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "roleId" uuid NOT NULL,
        "objectMetadataId" uuid NOT NULL,
        "filter" jsonb NOT NULL DEFAULT '{}',
        "currentMemberFieldName" text,
        "workspaceId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recordVisibilityPolicy_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recordVisibilityPolicy_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recordVisibilityPolicy_roleId" FOREIGN KEY ("roleId") REFERENCES "core"."role"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recordVisibilityPolicy_objectMetadataId" FOREIGN KEY ("objectMetadataId") REFERENCES "core"."objectMetadata"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_RECORD_VISIBILITY_POLICY_WORKSPACE_ROLE_OBJECT_UNIQUE"
        ON "core"."recordVisibilityPolicy" ("workspaceId", "roleId", "objectMetadataId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "core"."recordVisibilityPolicy"`,
    );
  }
}
