import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { type ProjectMemberRole } from '@/project-management/hooks/useCurrentProjectRole';
import { Tag } from 'twenty-ui/data-display';

type ProjectRoleTagProps = {
  role: ProjectMemberRole;
};

export const ProjectRoleTag = ({ role }: ProjectRoleTagProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'projectMember',
  });

  const roleField = objectMetadataItem.fields.find(
    (field) => field.name === 'projectRole',
  );

  const option = roleField?.options?.find((option) => option.value === role);

  if (!option) {
    return null;
  }

  return <Tag color={option.color} text={option.label} />;
};
