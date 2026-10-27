import { PRODUCT_ITEM_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { type ProductItem } from '../../types/product-backlog';
import { resolveEffectiveAppId } from '../app-scope/resolve-effective-app-id.util';
import { createIssueWithReservedKey } from './create-issue-with-reserved-key.util';

// A new backlog item, keyed like any issue. The caller has already checked
// write access on the project.
export const createProductItem = async ({
  client,
  scope,
  projectId,
  data,
}: {
  client: ApiClient;
  scope: CallerScope;
  projectId: string;
  data: Record<string, unknown>;
}): Promise<ProductItem> => {
  const appId = await resolveEffectiveAppId({
    client,
    objectNameSingular: 'issue',
    immediateForeignKeyValue: projectId,
  });

  const issue = await createIssueWithReservedKey({
    client,
    projectId,
    data: {
      issueType: 'STORY',
      position: 'last',
      ...data,
      projectId,
      appId,
      stage: 'ITEM',
      ...(scope.workspaceMemberId === null
        ? {}
        : { reporterId: scope.workspaceMemberId }),
    },
    selection: PRODUCT_ITEM_SELECTION,
  });

  if (typeof issue?.id !== 'string') {
    throw new Error('The backlog item could not be created.');
  }

  return issue as ProductItem;
};
