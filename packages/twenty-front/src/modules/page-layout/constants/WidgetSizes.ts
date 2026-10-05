import { type WidgetSizeConfig } from '@/page-layout/types/WidgetSizeConfig';
import { WidgetType } from '~/generated-metadata/graphql';

export const WIDGET_SIZES: Partial<Record<WidgetType, WidgetSizeConfig>> = {
  [WidgetType.IFRAME]: {
    default: { w: 6, h: 6 },
    minimum: { w: 4, h: 5 },
  },
  [WidgetType.STANDALONE_RICH_TEXT]: {
    default: { w: 4, h: 4 },
    minimum: { w: 2, h: 2 },
  },
  [WidgetType.FRONT_COMPONENT]: {
    default: { w: 8, h: 8 },
    // App widgets scroll inside their own slot, so a two-row floor is
    // enough: compact panels like Subtasks and Attachments ship below the
    // old four-row floor today and were unshrinkable because of it.
    minimum: { w: 4, h: 2 },
  },
  [WidgetType.RECORD_TABLE]: {
    default: { w: 6, h: 6 },
    minimum: { w: 4, h: 3 },
  },
};
