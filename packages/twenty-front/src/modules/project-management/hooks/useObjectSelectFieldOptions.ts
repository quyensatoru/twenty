import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';

export const useObjectSelectFieldOptions = (
  objectNameSingular: string,
  fieldName: string,
) => {
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });

  const field = objectMetadataItem.fields.find(
    (field) => field.name === fieldName,
  );

  const options = [...(field?.options ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  return { options };
};
