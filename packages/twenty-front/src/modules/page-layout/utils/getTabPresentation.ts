import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { type TabPresentation } from '@/page-layout/types/TabPresentation';
import {
  PageLayoutTabLayoutMode,
  WidgetType,
} from '~/generated-metadata/graphql';

type GetTabPresentationParams = {
  widgets: PageLayoutWidget[];
  layoutMode: PageLayoutTabLayoutMode;
  isInEditMode?: boolean;
};

// Presentation is derived from content, never stored. In view mode, a list tab
// hosting a single widget renders it solo: full-bleed, owning the tab. Any
// other tab is a stack of boxed widgets. Edit mode always shows the stack
// structure so every tab is edited through the same vertical-list editor.
// Grid tabs (dashboards) are always stacks. A lone Fields widget stays boxed:
// unlike a table or board, a plain field list has no visual chrome of its own
// and reads as broken (text flush to the panel edge) when stripped of padding.
export const getTabPresentation = ({
  widgets,
  layoutMode,
  isInEditMode = false,
}: GetTabPresentationParams): TabPresentation => {
  if (isInEditMode || layoutMode === PageLayoutTabLayoutMode.GRID) {
    return 'stack';
  }

  return widgets.length === 1 && widgets[0].type !== WidgetType.FIELDS
    ? 'solo'
    : 'stack';
};
