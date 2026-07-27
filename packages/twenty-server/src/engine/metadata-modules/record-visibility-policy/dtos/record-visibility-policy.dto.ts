import { Field, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

@ObjectType('RecordVisibilityPolicy')
export class RecordVisibilityPolicyDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  roleId: string;

  @Field(() => String)
  objectMetadataId: string;

  @Field(() => GraphQLJSON)
  filter: RecordGqlOperationFilter;

  @Field(() => String, { nullable: true })
  currentMemberFieldName: string | null;
}
