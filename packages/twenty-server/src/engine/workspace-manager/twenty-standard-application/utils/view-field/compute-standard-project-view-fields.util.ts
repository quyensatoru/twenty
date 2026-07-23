import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  createStandardViewFieldFlatMetadata,
  type CreateStandardViewFieldArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardProjectViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'project'>, 'context'>,
): Record<string, FlatViewField> => {
  return {
    allProjectsName: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'allProjects',
        viewFieldName: 'name',
        fieldName: 'name',
        position: 0,
        isVisible: true,
        size: 210,
      },
    }),
    allProjectsKey: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'allProjects',
        viewFieldName: 'key',
        fieldName: 'key',
        position: 1,
        isVisible: true,
        size: 100,
      },
    }),
    allProjectsCategory: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'allProjects',
        viewFieldName: 'category',
        fieldName: 'category',
        position: 2,
        isVisible: true,
        size: 150,
      },
    }),
    allProjectsLead: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'allProjects',
        viewFieldName: 'lead',
        fieldName: 'lead',
        position: 3,
        isVisible: true,
        size: 150,
      },
    }),
    allProjectsCreatedAt: createStandardViewFieldFlatMetadata({
      ...args,
      objectName: 'project',
      context: {
        viewName: 'allProjects',
        viewFieldName: 'createdAt',
        fieldName: 'createdAt',
        position: 4,
        isVisible: true,
        size: 150,
      },
    }),
  };
};
