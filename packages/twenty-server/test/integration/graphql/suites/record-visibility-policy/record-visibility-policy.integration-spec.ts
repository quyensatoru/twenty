import { randomUUID } from 'crypto';

import { createOneOperationFactory } from 'test/integration/graphql/utils/create-one-operation-factory.util';
import { findManyOperationFactory } from 'test/integration/graphql/utils/find-many-operation-factory.util';
import { makeGraphqlAPIRequest } from 'test/integration/graphql/utils/make-graphql-api-request.util';
import { findManyObjectMetadata } from 'test/integration/metadata/suites/object-metadata/utils/find-many-object-metadata.util';
import { upsertObjectPermissions } from 'test/integration/metadata/suites/object-permission/utils/upsert-object-permissions.util';
import { deleteRecordVisibilityPolicy } from 'test/integration/metadata/suites/record-visibility-policy/utils/delete-record-visibility-policy.util';
import { upsertRecordVisibilityPolicy } from 'test/integration/metadata/suites/record-visibility-policy/utils/upsert-record-visibility-policy.util';
import { createOneRole } from 'test/integration/metadata/suites/role/utils/create-one-role.util';
import { deleteOneRole } from 'test/integration/metadata/suites/role/utils/delete-one-role.util';
import { findOneRoleByLabel } from 'test/integration/metadata/suites/role/utils/find-one-role-by-label.util';
import { updateWorkspaceMemberRole } from 'test/integration/metadata/suites/role/utils/update-workspace-member-role.util';
import { deleteRecordsByIds } from 'test/integration/utils/delete-records-by-ids';
import { jestExpectToBeDefined } from 'test/utils/jest-expect-to-be-defined.util.test';

import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

// Verifies the Record Visibility Policy layer end to end: a static rule
// (Company.name equality — no relation to any current-member context) and a
// currentMemberFieldName rule (Issue.assignee == whoever is asking). The
// seeded dev roles both carry blanket canXAllObjectRecords = true, which no
// policy is ever attached to, so this suite creates a dedicated role and
// assigns it to Jony/Phil for the duration, restoring their original roles in
// afterAll — same pattern as app-scope.integration-spec.ts.
describe('record visibility policy enforcement', () => {
  let originalJonyRoleId: string;
  let originalPhilRoleId: string;
  let customRoleId: string;
  let companyObjectMetadataId: string;
  let projectObjectMetadataId: string;
  let issueObjectMetadataId: string;
  let appObjectMetadataId: string;

  const testAppId = randomUUID();
  const testProjectId = randomUUID();
  const blueCompanyId = randomUUID();
  const otherCompanyId = randomUUID();
  const jonyIssueId = randomUUID();
  const philIssueId = randomUUID();

  const createdRecordIdsByObject: Record<string, string[]> = {
    issue: [],
    project: [],
    company: [],
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

    companyObjectMetadataId = findObjectMetadataId('company');
    projectObjectMetadataId = findObjectMetadataId('project');
    issueObjectMetadataId = findObjectMetadataId('issue');
    appObjectMetadataId = findObjectMetadataId('app');

    const memberRole = await findOneRoleByLabel({ label: 'Member' });

    jestExpectToBeDefined(memberRole);
    originalJonyRoleId = memberRole.id;

    const guestRole = await findOneRoleByLabel({ label: 'Guest' });

    jestExpectToBeDefined(guestRole);
    originalPhilRoleId = guestRole.id;

    const { data: roleData } = await createOneRole({
      expectToFail: false,
      input: {
        label: 'RecordVisibilityPolicyTestRole',
        description: 'Role for record-visibility-policy integration tests',
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

    await upsertObjectPermissions({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        objectPermissions: [
          {
            objectMetadataId: companyObjectMetadataId,
            canReadObjectRecords: true,
            canUpdateObjectRecords: true,
            canSoftDeleteObjectRecords: true,
            canDestroyObjectRecords: true,
          },
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
            objectMetadataId: appObjectMetadataId,
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

    // Fixtures created as Jane (admin, default token) so app-scope/RVP
    // restrictions on Jony/Phil don't affect setup.
    await create('app', { id: testAppId, name: 'RvpTestApp' });
    createdRecordIdsByObject.app.push(testAppId);

    await create('project', {
      id: testProjectId,
      name: 'RVP Test Project',
      key: 'RVP',
      appId: testAppId,
    });
    createdRecordIdsByObject.project.push(testProjectId);

    // Both Jony and Phil get full app-scope access to the same app/project —
    // isolates what's under test to the Record Visibility Policy layer alone,
    // rather than app-scope also restricting visibility.
    const jonyGrantId = randomUUID();

    await create('appAccess', {
      id: jonyGrantId,
      memberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
      appId: testAppId,
      permissions: ['READ', 'WRITE'],
    });
    createdRecordIdsByObject.appAccess.push(jonyGrantId);

    const philGrantId = randomUUID();

    await create('appAccess', {
      id: philGrantId,
      memberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
      appId: testAppId,
      permissions: ['READ', 'WRITE'],
    });
    createdRecordIdsByObject.appAccess.push(philGrantId);

    await create('company', { id: blueCompanyId, name: 'Blue Co' });
    createdRecordIdsByObject.company.push(blueCompanyId);

    await create('company', { id: otherCompanyId, name: 'Other Co' });
    createdRecordIdsByObject.company.push(otherCompanyId);

    await create('issue', {
      id: jonyIssueId,
      title: "Jony's issue",
      projectId: testProjectId,
      assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    });
    createdRecordIdsByObject.issue.push(jonyIssueId);

    await create('issue', {
      id: philIssueId,
      title: "Phil's issue",
      projectId: testProjectId,
      assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    });
    createdRecordIdsByObject.issue.push(philIssueId);

    // Static rule: only Company records named "Blue Co" are visible.
    await upsertRecordVisibilityPolicy({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        objectMetadataId: companyObjectMetadataId,
        filter: { name: { eq: 'Blue Co' } },
      },
    });

    // currentMemberFieldName rule: only issues assigned to the requester.
    await upsertRecordVisibilityPolicy({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        objectMetadataId: issueObjectMetadataId,
        filter: { assigneeId: { in: ['$$CURRENT_MEMBER$$'] } },
        currentMemberFieldName: 'id',
      },
    });
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
      await deleteRecordVisibilityPolicy({
        expectToFail: true, // role is about to be deleted anyway; best-effort
        input: { roleId: customRoleId, objectMetadataId: companyObjectMetadataId },
      });
      await deleteRecordVisibilityPolicy({
        expectToFail: true,
        input: { roleId: customRoleId, objectMetadataId: issueObjectMetadataId },
      });

      await deleteOneRole({
        expectToFail: false,
        input: { idToDelete: customRoleId },
      });
    }
  });

  it('RVP-1: static filter — Jony sees the Company matching the static rule', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'company',
        objectMetadataPluralName: 'companies',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.companies.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(blueCompanyId);
    expect(ids).not.toContain(otherCompanyId);
  });

  it('RVP-2: currentMemberFieldName — Jony sees only the issue assigned to Jony', async () => {
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

    expect(ids).toContain(jonyIssueId);
    expect(ids).not.toContain(philIssueId);
  });

  it('RVP-3: currentMemberFieldName — Phil sees only the issue assigned to Phil', async () => {
    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'issue',
        objectMetadataPluralName: 'issues',
        gqlFields: 'id',
      }),
      APPLE_PHIL_GUEST_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.issues.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(philIssueId);
    expect(ids).not.toContain(jonyIssueId);
  });

  it('RVP-4: currentMemberFieldName — Jony is denied creating an issue assigned to someone else', async () => {
    const newIssueId = randomUUID();
    const response = await makeGraphqlAPIRequest(
      createOneOperationFactory({
        objectMetadataSingularName: 'issue',
        gqlFields: 'id',
        data: {
          id: newIssueId,
          title: "Jony's issue assigned to Phil",
          projectId: testProjectId,
          assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
        },
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeDefined();
  });

  it('RVP-5: delete policy — after deleting the Company policy, Jony sees both companies again', async () => {
    await deleteRecordVisibilityPolicy({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        objectMetadataId: companyObjectMetadataId,
      },
    });

    const response = await makeGraphqlAPIRequest(
      findManyOperationFactory({
        objectMetadataSingularName: 'company',
        objectMetadataPluralName: 'companies',
        gqlFields: 'id',
      }),
      APPLE_JONY_MEMBER_ACCESS_TOKEN,
    );

    expect(response.body.errors).toBeUndefined();

    const ids = response.body.data.companies.edges.map(
      (edge: any) => edge.node.id,
    );

    expect(ids).toContain(blueCompanyId);
    expect(ids).toContain(otherCompanyId);

    // Re-create it so afterAll's best-effort delete stays a no-op either way.
    await upsertRecordVisibilityPolicy({
      expectToFail: false,
      input: {
        roleId: customRoleId,
        objectMetadataId: companyObjectMetadataId,
        filter: { name: { eq: 'Blue Co' } },
      },
    });
  });
});
