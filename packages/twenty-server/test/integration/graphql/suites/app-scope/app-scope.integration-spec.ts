import { randomUUID } from 'crypto';

import { createOneOperationFactory } from 'test/integration/graphql/utils/create-one-operation-factory.util';
import { findManyOperationFactory } from 'test/integration/graphql/utils/find-many-operation-factory.util';
import { groupByOperationFactory } from 'test/integration/graphql/utils/group-by-operation-factory.util';
import { makeGraphqlAPIRequest } from 'test/integration/graphql/utils/make-graphql-api-request.util';
import { findManyObjectMetadata } from 'test/integration/metadata/suites/object-metadata/utils/find-many-object-metadata.util';
import { upsertObjectPermissions } from 'test/integration/metadata/suites/object-permission/utils/upsert-object-permissions.util';
import { createOneRole } from 'test/integration/metadata/suites/role/utils/create-one-role.util';
import { deleteOneRole } from 'test/integration/metadata/suites/role/utils/delete-one-role.util';
import { findOneRoleByLabel } from 'test/integration/metadata/suites/role/utils/find-one-role-by-label.util';
import { updateWorkspaceMemberRole } from 'test/integration/metadata/suites/role/utils/update-workspace-member-role.util';
import { deleteRecordsByIds } from 'test/integration/utils/delete-records-by-ids';
import { jestExpectToBeDefined } from 'test/utils/jest-expect-to-be-defined.util.test';

import { ErrorCode } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { PermissionsExceptionMessage } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

// Verifies the app-scope permission layer end to end: `app` (1) -> `project` (N,
// scope root) -> `issue` (N, 1 hop) -> `worklog` (N, 2 hops). The seeded dev
// roles ("Admin", "Member") both carry blanket canXAllObjectRecords = true,
// which bypasses app-scope entirely (see shouldBypassAppScope), so this suite
// creates a dedicated role WITHOUT that bypass and assigns it to Jony/Phil for
// the duration of the tests, restoring their original roles in afterAll.
describe('app-scope permission enforcement', () => {
  let originalJonyRoleId: string;
  let originalPhilRoleId: string;
  let customRoleId: string;
  let appObjectMetadataId: string;
  let appAccessObjectMetadataId: string;
  let projectObjectMetadataId: string;
  let issueObjectMetadataId: string;
  let worklogObjectMetadataId: string;

  const blueAppId = randomUUID();
  const otherAppId = randomUUID();
  const blueProjectId = randomUUID();
  const otherProjectId = randomUUID();
  const nullAppProjectId = randomUUID();
  const blueIssueId = randomUUID();
  const otherIssueId = randomUUID();
  const blueWorklogId = randomUUID();
  const otherWorklogId = randomUUID();

  const createdRecordIdsByObject: Record<string, string[]> = {
    worklog: [],
    issue: [],
    project: [],
    appAccess: [],
    app: [],
  };

  const create = async (
    objectMetadataSingularName: string,
    data: object,
  ): Promise<void> => {
    const response = await makeGraphqlAPIRequest(
      createOneOperationFactory({
        objectMetadataSingularName,
        gqlFields: 'id',
        data,
      }),
    );

    if (response.body.errors) {
      throw new Error(
        `Fixture creation failed for ${objectMetadataSingularName}: ${JSON.stringify(response.body.errors)}`,
      );
    }
  };

  beforeAll(async () => {
    const { objects } = await findManyObjectMetadata({
      expectToFail: false,
      input: { filter: {}, paging: { first: 1000 } },
      gqlFields: `id nameSingular`,
    });

    jestExpectToBeDefined(objects);

    const findObjectMetadataId = (nameSingular: string): string => {
      const found = objects.find(
        (object: any) => object.nameSingular === nameSingular,
      );

      jestExpectToBeDefined(found);

      return found.id;
    };

    appObjectMetadataId = findObjectMetadataId('app');
    appAccessObjectMetadataId = findObjectMetadataId('appAccess');
    projectObjectMetadataId = findObjectMetadataId('project');
    issueObjectMetadataId = findObjectMetadataId('issue');
    worklogObjectMetadataId = findObjectMetadataId('worklog');

    const memberRole = await findOneRoleByLabel({ label: 'Member' });

    jestExpectToBeDefined(memberRole);
    originalJonyRoleId = memberRole.id;

    const guestRole = await findOneRoleByLabel({ label: 'Guest' });

    jestExpectToBeDefined(guestRole);
    originalPhilRoleId = guestRole.id;

    const { data: roleData } = await createOneRole({
      expectToFail: false,
      input: {
        label: 'AppScopeTestRole',
        description: 'Role for app-scope integration tests (no blanket bypass)',
        icon: 'IconLock',
        canUpdateAllSettings: false,
        canAccessAllTools: false,
        canReadAllObjectRecords: false,
        canUpdateAllObjectRecords: false,
        canSoftDeleteAllObjectRecords: false,
        canDestroyAllObjectRecords: false,
        canBeAssignedToUsers: true,
        canBeAssignedToAgents: false,
        canBeAssignedToApiKeys: false,
      },
    });

    customRoleId = roleData?.createOneRole?.id;
    jestExpectToBeDefined(customRoleId);

    // Role-level access to the 5 objects — app-scope is the only remaining
    // restriction once this is granted.
    await upsertObjectPermissions({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        objectPermissions: [
          {
            objectMetadataId: projectObjectMetadataId,
            canReadObjectRecords: true,
            canUpdateObjectRecords: true,
            canSoftDeleteObjectRecords: true,
            canDestroyObjectRecords: true,
          },
          {
            objectMetadataId: issueObjectMetadataId,
            canReadObjectRecords: true,
            canUpdateObjectRecords: true,
            canSoftDeleteObjectRecords: true,
            canDestroyObjectRecords: true,
          },
          {
            objectMetadataId: worklogObjectMetadataId,
            canReadObjectRecords: true,
            canUpdateObjectRecords: true,
            canSoftDeleteObjectRecords: true,
            canDestroyObjectRecords: true,
          },
          {
            objectMetadataId: appObjectMetadataId,
            canReadObjectRecords: true,
            canUpdateObjectRecords: false,
            canSoftDeleteObjectRecords: false,
            canDestroyObjectRecords: false,
          },
          {
            objectMetadataId: appAccessObjectMetadataId,
            canReadObjectRecords: true,
            canUpdateObjectRecords: false,
            canSoftDeleteObjectRecords: false,
            canDestroyObjectRecords: false,
          },
        ],
      },
    });

    await updateWorkspaceMemberRole({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
      },
    });

    await updateWorkspaceMemberRole({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
      },
    });

    // Fixtures — 2 apps, 3 projects (one per app + one with no app), 2 issues,
    // 2 worklogs. All created as Jane (admin, default token), so Role/app-scope
    // restrictions on Jony/Phil don't affect fixture setup.
    await create('app', { id: blueAppId, name: 'BLOY' });
    createdRecordIdsByObject.app.push(blueAppId);

    await create('app', { id: otherAppId, name: 'Fraud' });
    createdRecordIdsByObject.app.push(otherAppId);

    await create('project', {
      id: blueProjectId,
      name: 'Blue Project',
      key: 'BLU',
      appId: blueAppId,
    });
    createdRecordIdsByObject.project.push(blueProjectId);

    await create('project', {
      id: otherProjectId,
      name: 'Other Project',
      key: 'OTH',
      appId: otherAppId,
    });
    createdRecordIdsByObject.project.push(otherProjectId);

    await create('project', {
      id: nullAppProjectId,
      name: 'No App Project',
      key: 'NOA',
    });
    createdRecordIdsByObject.project.push(nullAppProjectId);

    await create('issue', {
      id: blueIssueId,
      title: 'Blue issue',
      projectId: blueProjectId,
    });
    createdRecordIdsByObject.issue.push(blueIssueId);

    await create('issue', {
      id: otherIssueId,
      title: 'Other issue',
      projectId: otherProjectId,
    });
    createdRecordIdsByObject.issue.push(otherIssueId);

    await create('worklog', {
      id: blueWorklogId,
      description: 'blue work',
      timeSpentMinutes: 30,
      issueId: blueIssueId,
    });
    createdRecordIdsByObject.worklog.push(blueWorklogId);

    await create('worklog', {
      id: otherWorklogId,
      description: 'other work',
      timeSpentMinutes: 30,
      issueId: otherIssueId,
    });
    createdRecordIdsByObject.worklog.push(otherWorklogId);

    // Jony: BLOY only, read + write. Phil: no grants at all (AC-8).
    const jonyGrantId = randomUUID();

    await create('appAccess', {
      id: jonyGrantId,
      memberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
      appId: blueAppId,
      permissions: ['READ', 'WRITE'],
    });
    createdRecordIdsByObject.appAccess.push(jonyGrantId);
  });

  afterAll(async () => {
    await updateWorkspaceMemberRole({
      expectToFail: false,
      input: {
        workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
        roleId: originalJonyRoleId,
      },
    });

    await updateWorkspaceMemberRole({
      expectToFail: false,
      input: {
        workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
        roleId: originalPhilRoleId,
      },
    });

    for (const [objectNameSingular, ids] of Object.entries(
      createdRecordIdsByObject,
    )) {
      await deleteRecordsByIds(objectNameSingular, ids);
    }

    if (customRoleId) {
      await deleteOneRole({
        expectToFail: false,
        input: { idToDelete: customRoleId },
      });
    }
  });

  it('AC-1: read filter — Jony (BLOY-only grant) sees the BLOY project but not Fraud or the no-app project', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'project',
        objectMetadataPluralName: 'projects',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.projects.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(blueProjectId);
    expect(ids).not.toContain(otherProjectId);
    expect(ids).not.toContain(nullAppProjectId);
  });

  it('AC-13: transitive read filter (1 hop) — Jony sees issues in the BLOY project but not Fraud', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'issue',
        objectMetadataPluralName: 'issues',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.issues.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(blueIssueId);
    expect(ids).not.toContain(otherIssueId);
  });

  it('AC-13b: transitive read filter (1 hop) also applies in the Kanban board group-by-with-records query — Jony sees the BLOY issue but not Fraud, even though both default to the same "TODO" status group', async () => {
    const response = await makeGraphqlAPIRequest(
      groupByOperationFactory({
        objectMetadataSingularName: 'issue',
        objectMetadataPluralName: 'issues',
        groupBy: [{ status: true }],
        gqlFields: 'edges { node { id } }',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.issuesGroupBy.flatMap(
      (group: { edges: { node: { id: string } }[] }) =>
        group.edges.map((edge) => edge.node.id),
    );

    expect(ids).toContain(blueIssueId);
    expect(ids).not.toContain(otherIssueId);
  });

  it('AC-14: transitive read filter (2 hops) — Jony sees worklogs under the BLOY issue but not Fraud', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'worklog',
        objectMetadataPluralName: 'worklogs',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.worklogs.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(blueWorklogId);
    expect(ids).not.toContain(otherWorklogId);
  });

  it('AC-3: create guard — Jony can create an issue in the BLOY project (write granted)', async () => {
    const newIssueId = randomUUID();
    const response = await makeGraphqlAPIRequest(
      createOneOperationFactory({
        objectMetadataSingularName: 'issue',
        gqlFields: 'id',
        data: {
          id: newIssueId,
          title: 'Jony blue issue',
          projectId: blueProjectId,
        },
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();
    createdRecordIdsByObject.issue.push(newIssueId);
  });

  it('AC-3: create guard — Jony is denied creating an issue in the Fraud project (no grant on Fraud)', async () => {
    const newIssueId = randomUUID();
    const response = await makeGraphqlAPIRequest(
      createOneOperationFactory({
        objectMetadataSingularName: 'issue',
        gqlFields: 'id',
        data: {
          id: newIssueId,
          title: 'Jony fraud issue',
          projectId: otherProjectId,
        },
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      PermissionsExceptionMessage.PERMISSION_DENIED,
    );
    expect(response.body.errors[0].extensions.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('AC-8: empty grant — Phil (Role access, zero appAccess grants) sees no projects at all', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'project',
        objectMetadataPluralName: 'projects',
        gqlFields: 'id',
      }),
      APPLE_PHIL_GUEST_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.projects.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).not.toContain(blueProjectId);
    expect(ids).not.toContain(otherProjectId);
    expect(ids).not.toContain(nullAppProjectId);
  });

  it('AC-2: bypass — Jane (Admin, blanket canReadAllObjectRecords) sees all projects regardless of app grants', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'project',
        objectMetadataPluralName: 'projects',
        gqlFields: 'id',
      }),
      // default token is APPLE_JANE_ADMIN_ACCESS_TOKEN
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.projects.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(blueProjectId);
    expect(ids).toContain(otherProjectId);
    expect(ids).toContain(nullAppProjectId);
  });

  it('AC-16: App self-scope — Jony (BLOY-only appAccess grant) sees BLOY in the apps list but not Fraud, despite Role read access to `app`', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'app',
        objectMetadataPluralName: 'apps',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.apps.edges.map((edge: any) => edge.node.id);

    expect(ids).toContain(blueAppId);
    expect(ids).not.toContain(otherAppId);
  });

  it('AC-17: App self-scope — Phil (Role access, zero appAccess grants) sees no apps at all', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'app',
        objectMetadataPluralName: 'apps',
        gqlFields: 'id',
      }),
      APPLE_PHIL_GUEST_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.apps.edges.map((edge: any) => edge.node.id);

    expect(ids).not.toContain(blueAppId);
    expect(ids).not.toContain(otherAppId);
  });

  it('AC-18: App self-scope — Jane (Admin, blanket canReadAllObjectRecords) sees all apps regardless of app grants', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'app',
        objectMetadataPluralName: 'apps',
        gqlFields: 'id',
      }),
      // default token is APPLE_JANE_ADMIN_ACCESS_TOKEN
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.apps.edges.map((edge: any) => edge.node.id);

    expect(ids).toContain(blueAppId);
    expect(ids).toContain(otherAppId);
  });

  it('AC-15: NULL project.app hides the whole subtree from non-bypass members even with Role access', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'project',
        objectMetadataPluralName: 'projects',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.projects.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).not.toContain(nullAppProjectId);
  });
});
