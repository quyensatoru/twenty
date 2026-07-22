import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { type ProjectIssue } from '@/project-management/hooks/useProjectIssues';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledForm = styled.form`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const inputStyle = {
  border: `1px solid ${themeCssVariables.border.color.medium}`,
  borderRadius: 4,
  fontSize: 13,
  padding: '4px 8px',
} as const;

type ProjectTimeLogFormProps = {
  issues: ProjectIssue[];
  onCreated: () => void;
};

export const ProjectTimeLogForm = ({
  issues,
  onCreated,
}: ProjectTimeLogFormProps) => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'timeLog',
  });

  const [issueId, setIssueId] = useState('');
  const [minutesSpent, setMinutesSpent] = useState('');
  const [loggedDate, setLoggedDate] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!issueId || !minutesSpent || !loggedDate || !currentWorkspaceMember) {
      return;
    }

    await createOneRecord({
      issueId,
      memberId: currentWorkspaceMember.id,
      minutesSpent: Number(minutesSpent),
      loggedDate,
      description: description || null,
    });

    setIssueId('');
    setMinutesSpent('');
    setLoggedDate('');
    setDescription('');
    onCreated();
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <select
        style={inputStyle}
        value={issueId}
        onChange={(event) => setIssueId(event.target.value)}
        required
      >
        <option value="">Select issue…</option>
        {issues.map((issue) => (
          <option key={issue.id} value={issue.id}>
            {issue.name}
          </option>
        ))}
      </select>
      <input
        style={{ ...inputStyle, width: 90 }}
        type="number"
        min={1}
        placeholder="Minutes"
        value={minutesSpent}
        onChange={(event) => setMinutesSpent(event.target.value)}
        required
      />
      <input
        style={inputStyle}
        type="date"
        value={loggedDate}
        onChange={(event) => setLoggedDate(event.target.value)}
        required
      />
      <input
        style={{ ...inputStyle, flex: 1, minWidth: 160 }}
        type="text"
        placeholder="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Button type="submit" title="Log Time" size="small" />
    </StyledForm>
  );
};
