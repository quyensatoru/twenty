import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { type BcMemberRole } from '../../types/bc-records';
import {
  type SettingsMember,
  type SettingsResult,
  type SettingsSaveBody,
  type SettingsTeam,
} from '../../types/settings';
import { BcSelect } from './bc-select';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

type SaveSettings = (body: SettingsSaveBody) => Promise<boolean>;

const ROLE_OPTIONS = (): { value: BcMemberRole; label: string }[] => [
  { value: 'BC', label: t('Business Consultant') },
  { value: 'MANAGER', label: t('Manager') },
  { value: 'ADMIN', label: t('BC Workspace admin') },
];

const splitNames = (value: string): string[] =>
  value
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

const SettingsMemberRow = ({
  member,
  isSaving,
  onSave,
}: {
  member: SettingsMember;
  isSaving: boolean;
  onSave: SaveSettings;
}) => {
  const savedNames = member.crispOperatorNames.join(', ');
  const [operatorNames, setOperatorNames] = useState(savedNames);
  const saveMember = (overrides: Partial<{ role: BcMemberRole; crispOperatorNames: string[] }>) =>
    onSave({
      action: 'saveMember',
      member: {
        id: member.id,
        workspaceMemberId: member.workspaceMemberId ?? undefined,
        teamId: member.teamId ?? undefined,
        role: member.role,
        crispOperatorNames: splitNames(operatorNames),
        isActive: member.isActive,
        ...overrides,
      },
    });

  return (
    <div
      style={{
        alignItems: 'center',
        borderTop: `1px solid ${BC_TOKENS.borderLight}`,
        display: 'grid',
        gap: spacing(2),
        gridTemplateColumns: 'minmax(120px, 1fr) 150px',
        padding: `${spacing(2)} 0`,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontWeight: BC_TOKENS.fontWeightMedium }}>{member.name}</span>
        <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
          {member.email ?? ''}
        </span>
      </span>
      <BcSelect
        ariaLabel={t('Role of {name}', { name: member.name })}
        value={member.role}
        options={ROLE_OPTIONS()}
        isDisabled={isSaving}
        onChange={(role) => void saveMember({ role: role as BcMemberRole })}
      />
      <span style={{ gridColumn: '1 / -1', display: 'flex', gap: spacing(2) }}>
        <span style={{ flex: 1 }}>
          <BcTextInput
            ariaLabel={t('Crisp operator names of {name}', { name: member.name })}
            placeholder={t('Crisp operator names, comma separated')}
            value={operatorNames}
            onChange={setOperatorNames}
          />
        </span>
        <Button
          variant="outline"
          color="neutral"
          size="sm"
          disabled={isSaving || operatorNames.trim() === savedNames}
          onClick={() => void saveMember({ crispOperatorNames: splitNames(operatorNames) })}
        >
          {t('Save')}
        </Button>
        <Button
          variant="ghost"
          color="danger"
          size="sm"
          aria-label={t('Remove {name} from the team', { name: member.name })}
          disabled={isSaving}
          startIcon={<IconTrash size={14} />}
          onClick={() => void onSave({ action: 'removeMember', id: member.id })}
        />
      </span>
    </div>
  );
};

const SettingsTeamCard = ({
  team,
  settings,
  isSaving,
  onSave,
}: {
  team: SettingsTeam;
  settings: SettingsResult;
  isSaving: boolean;
  onSave: SaveSettings;
}) => {
  const [newMemberId, setNewMemberId] = useState('');
  const [newRole, setNewRole] = useState<BcMemberRole>('BC');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const teamMembers = settings.members.filter((member) => member.teamId === team.id);
  const memberIdsInTeam = new Set(teamMembers.map((member) => member.workspaceMemberId));
  const candidates = settings.workspaceMembers
    .filter((member) => !memberIdsInTeam.has(member.id))
    .map((member) => ({
      value: member.id,
      label: member.name,
      description: member.email ?? undefined,
    }));

  return (
    <div
      style={{
        border: `1px solid ${BC_TOKENS.borderLight}`,
        borderRadius: BC_TOKENS.radius,
        display: 'flex',
        flexDirection: 'column',
        padding: spacing(3),
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: spacing(2), justifyContent: 'space-between' }}>
        <span style={{ fontWeight: BC_TOKENS.fontWeightSemiBold }}>{team.name}</span>
        {isConfirmingDelete ? (
          <span style={{ display: 'flex', gap: spacing(1) }}>
            <Button variant="ghost" color="neutral" size="sm" onClick={() => setIsConfirmingDelete(false)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="solid"
              color="danger"
              size="sm"
              disabled={isSaving}
              onClick={() => void onSave({ action: 'deleteTeam', teamId: team.id })}
            >
              {t('Delete team')}
            </Button>
          </span>
        ) : (
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label={t('Delete {team}', { team: team.name })}
            startIcon={<IconTrash size={14} />}
            onClick={() => setIsConfirmingDelete(true)}
          />
        )}
      </div>
      {teamMembers.length === 0 && (
        <span style={{ color: BC_TOKENS.textTertiary, padding: `${spacing(2)} 0` }}>
          {t('No members yet.')}
        </span>
      )}
      {teamMembers.map((member) => (
        <SettingsMemberRow
          key={`${member.id}-${member.crispOperatorNames.join(',')}`}
          member={member}
          isSaving={isSaving}
          onSave={onSave}
        />
      ))}
      <div
        style={{
          alignItems: 'center',
          borderTop: `1px solid ${BC_TOKENS.borderLight}`,
          display: 'flex',
          gap: spacing(2),
          paddingTop: spacing(2),
        }}
      >
        <span style={{ flex: 1, minWidth: 0 }}>
          <BcSelect
            ariaLabel={t('Person to add')}
            value={newMemberId}
            options={[{ value: '', label: t('Add a person…') }, ...candidates]}
            menuWidth={280}
            onChange={setNewMemberId}
          />
        </span>
        <span style={{ width: 150 }}>
          <BcSelect
            ariaLabel={t('Role')}
            value={newRole}
            options={ROLE_OPTIONS()}
            onChange={(role) => setNewRole(role as BcMemberRole)}
          />
        </span>
        <Button
          variant="outline"
          color="neutral"
          size="sm"
          startIcon={<IconPlus size={14} />}
          disabled={isSaving || newMemberId === ''}
          onClick={() =>
            void onSave({
              action: 'saveMember',
              member: { workspaceMemberId: newMemberId, teamId: team.id, role: newRole },
            }).then((isSaved) => {
              if (isSaved) {
                setNewMemberId('');
                setNewRole('BC');
              }
            })
          }
        >
          {t('Add')}
        </Button>
      </div>
    </div>
  );
};

export const SettingsTeamsTab = ({
  settings,
  isSaving,
  onSave,
}: {
  settings: SettingsResult;
  isSaving: boolean;
  onSave: SaveSettings;
}) => {
  const [teamName, setTeamName] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), padding: spacing(4) }}>
      <span style={{ color: BC_TOKENS.textSecondary, fontSize: BC_TOKENS.fontSizeSm }}>
        {t('BCs see the clients they own. Managers see every client of their team, unassigned clients and the financial figures. Crisp operator names let the CRM recognize a BC’s Crisp messages as BC contact.')}
      </span>
      <div style={{ display: 'flex', gap: spacing(2) }}>
        <span style={{ flex: 1 }}>
          <BcTextInput
            ariaLabel={t('New team name')}
            placeholder={t('New team name')}
            value={teamName}
            onChange={setTeamName}
          />
        </span>
        <Button
          variant="solid"
          color="accent"
          size="sm"
          startIcon={<IconPlus size={14} />}
          disabled={isSaving || teamName.trim().length === 0}
          onClick={() =>
            void onSave({ action: 'saveTeam', team: { name: teamName } }).then((isSaved) => {
              if (isSaved) {
                setTeamName('');
              }
            })
          }
        >
          {t('Add team')}
        </Button>
      </div>
      {settings.teams.length === 0 && (
        <span style={{ color: BC_TOKENS.textTertiary }}>
          {t('No BC team yet. Create one, then add its BCs and managers.')}
        </span>
      )}
      {settings.teams.map((team) => (
        <SettingsTeamCard
          key={team.id}
          team={team}
          settings={settings}
          isSaving={isSaving}
          onSave={onSave}
        />
      ))}
    </div>
  );
};
