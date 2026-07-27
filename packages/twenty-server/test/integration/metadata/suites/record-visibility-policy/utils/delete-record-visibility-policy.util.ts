import gql from 'graphql-tag';

import { makeMetadataAPIRequest } from 'test/integration/metadata/suites/utils/make-metadata-api-request.util';
import { type CommonResponseBody } from 'test/integration/metadata/types/common-response-body.type';
import { type PerformMetadataQueryParams } from 'test/integration/metadata/types/perform-metadata-query.type';
import { warnIfErrorButNotExpectedToFail } from 'test/integration/metadata/utils/warn-if-error-but-not-expected-to-fail.util';
import { warnIfNoErrorButExpectedToFail } from 'test/integration/metadata/utils/warn-if-no-error-but-expected-to-fail.util';

import { type DeleteRecordVisibilityPolicyInput } from 'src/engine/metadata-modules/record-visibility-policy/dtos/upsert-record-visibility-policy.input';

export const deleteRecordVisibilityPolicy = async ({
  input,
  expectToFail = false,
  token,
}: PerformMetadataQueryParams<DeleteRecordVisibilityPolicyInput>): CommonResponseBody<{
  deleteRecordVisibilityPolicy: boolean;
}> => {
  const graphqlOperation = {
    query: gql`
      mutation DeleteRecordVisibilityPolicy($input: DeleteRecordVisibilityPolicyInput!) {
        deleteRecordVisibilityPolicy(input: $input)
      }
    `,
    variables: { input },
  };

  const response = await makeMetadataAPIRequest(graphqlOperation, token);

  if (expectToFail === true) {
    warnIfNoErrorButExpectedToFail({
      response,
      errorMessage:
        'Record Visibility Policy delete should have failed but did not',
    });
  }

  if (expectToFail === false) {
    warnIfErrorButNotExpectedToFail({
      response,
      errorMessage: 'Record Visibility Policy delete has failed but should not',
    });
  }

  return { data: response.body.data, errors: response.body.errors };
};
