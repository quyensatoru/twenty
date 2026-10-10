import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import { REPOSITORY_PROVIDER_OPTIONS } from '../constants/repository-provider-options';
import {
  REPOSITORY_BASE_URL_FIELD_UID,
  REPOSITORY_CONNECTION_ID_FIELD_UID,
  REPOSITORY_EXTERNAL_ID_FIELD_UID,
  REPOSITORY_IS_ACTIVE_FIELD_UID,
  REPOSITORY_NAME_FIELD_UID,
  REPOSITORY_OBJECT_UID,
  REPOSITORY_PROVIDER_FIELD_UID,
  REPOSITORY_REMOTE_URL_FIELD_UID,
  REPOSITORY_SLUG_FIELD_UID,
} from '../constants/universal-identifiers';

// A git repository linked to a project through somebody's OAuth connection.
// Rows are created from the Development widget by picking a repo off a
// connected GitHub/GitLab account — never typed by hand — and the link route
// registers the provider webhook and enqueues the backfill behind it.
export default defineObject({
  universalIdentifier: REPOSITORY_OBJECT_UID,
  nameSingular: 'repository',
  namePlural: 'repositories',
  labelSingular: 'Repository',
  labelPlural: 'Repositories',
  description: 'A git repository linked to a project',
  icon: 'IconGitBranch',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: REPOSITORY_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Repository display name',
      icon: 'IconGitBranch',
      isNullable: true,
      isSearchable: true,
    },
    {
      universalIdentifier: REPOSITORY_PROVIDER_FIELD_UID,
      type: FieldType.SELECT,
      name: 'provider',
      label: 'Provider',
      description: 'Git hosting provider',
      icon: 'IconCloud',
      isNullable: true,
      defaultValue: "'OTHER'",
      options: [...REPOSITORY_PROVIDER_OPTIONS],
    },
    {
      universalIdentifier: REPOSITORY_SLUG_FIELD_UID,
      type: FieldType.TEXT,
      name: 'slug',
      label: 'Slug',
      description: 'owner/repo identifier the webhook uses to match',
      icon: 'IconLink',
      isNullable: true,
      isSearchable: true,
    },
    {
      universalIdentifier: REPOSITORY_REMOTE_URL_FIELD_UID,
      type: FieldType.TEXT,
      name: 'remoteUrl',
      label: 'Remote URL',
      description: 'Clone URL of the repository',
      icon: 'IconLink',
      isNullable: true,
    },
    {
      universalIdentifier: REPOSITORY_IS_ACTIVE_FIELD_UID,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Is active',
      description: 'Whether the provider webhook still feeds this repo',
      icon: 'IconToggleLeft',
      isNullable: true,
      defaultValue: true,
    },
    {
      // The OAuth connection (connectedAccountId) that linked this repo and
      // whose token the sync uses. Plain text: connections are not records.
      universalIdentifier: REPOSITORY_CONNECTION_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'connectionId',
      label: 'Connection id',
      description: 'OAuth connection behind this repository link',
      icon: 'IconKey',
      isNullable: true,
      isUIEditable: false,
    },
    {
      // The provider's own repo id (GitHub repo id, GitLab project id), used
      // for hook and backfill calls that need more than the slug.
      universalIdentifier: REPOSITORY_EXTERNAL_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'externalId',
      label: 'External id',
      description: "Provider's id for this repository",
      icon: 'IconHash',
      isNullable: true,
      isUIEditable: false,
    },
    {
      // API root of the instance this repo lives on (gitlab.com or a
      // self-hosted host). Stored per row so links survive host changes and
      // the runtime never hardcodes an instance.
      universalIdentifier: REPOSITORY_BASE_URL_FIELD_UID,
      type: FieldType.TEXT,
      name: 'baseUrl',
      label: 'Base URL',
      description: 'API root of the git instance',
      icon: 'IconLink',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
