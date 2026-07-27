import { Field, InputType } from '@nestjs/graphql';

import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class UpsertRecordVisibilityPolicyInput {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  roleId: string;

  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  objectMetadataId: string;

  @Field(() => GraphQLJSON)
  filter: RecordGqlOperationFilter;

  @IsOptional()
  @Field(() => String, { nullable: true })
  currentMemberFieldName?: string | null;
}

@InputType()
export class DeleteRecordVisibilityPolicyInput {
  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  roleId: string;

  @IsUUID()
  @IsNotEmpty()
  @Field(() => UUIDScalarType)
  objectMetadataId: string;
}
