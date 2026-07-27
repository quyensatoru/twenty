import gql from 'graphql-tag';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';
import { type CommonResponseBody } from 'test/integration/metadata/types/common-response-body.type';
import { type PerformMetadataQueryParams } from 'test/integration/metadata/types/perform-metadata-query.type';
import { warnIfErrorButNotExpectedToFail } from 'test/integration/metadata/utils/warn-if-error-but-not-expected-to-fail.util';
import { warnIfNoErrorButExpectedToFail } from 'test/integration/metadata/utils/warn-if-no-error-but-expected-to-fail.util';

import { type UpsertRecordVisibilityPolicyInput } from 'src/engine/metadata-modules/record-visibility-policy/dtos/upsert-record-visibility-policy.input';
import { type RecordVisibilityPolicyDTO } from 'src/engine/metadata-modules/record-visibility-policy/dtos/record-visibility-policy.dto';

const DEFAULT_RECORD_VISIBILITY_POLICY_GQL_FIELDS = `
  id
  roleId
  objectMetadataId
  filter
  currentMemberFieldName
`;

export const upsertRecordVisibilityPolicy = async ({
  input,
  gqlFields = DEFAULT_RECORD_VISIBILITY_POLICY_GQL_FIELDS,
  expectToFail = false,
  token,
}: PerformMetadataQueryParams<UpsertRecordVisibilityPolicyInput>): CommonResponseBody<{
  upsertRecordVisibilityPolicy: RecordVisibilityPolicyDTO;
}> => {
  const graphqlOperation = {
    query: gql`
      mutation UpsertRecordVisibilityPolicy($input: UpsertRecordVisibilityPolicyInput!) {
        upsertRecordVisibilityPolicy(input: $input) {
          ${gqlFields}
        }
      }
    `,
    variables: { input },
  };

  const response = await makeMetadataAPIRequest(graphqlOperation, token);

  if (expectToFail === true) {
    warnIfNoErrorButExpectedToFail({
      response,
      errorMessage:
        'Record Visibility Policy upsert should have failed but did not',
    });
  }

  if (expectToFail === false) {
    warnIfErrorButNotExpectedToFail({
      response,
      errorMessage: 'Record Visibility Policy upsert has failed but should not',
    });
  }

  return { data: response.body.data, errors: response.body.errors };
};
