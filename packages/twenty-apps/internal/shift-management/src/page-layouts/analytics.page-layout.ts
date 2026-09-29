import {
  AggregateOperations,
  definePageLayout,
  PageLayoutTabLayoutMode,
  PageLayoutType,
} from 'twenty-sdk/define';

import {
  ANALYTICS_CHARTS_TAB_UID,
  ANALYTICS_FRONT_COMPONENT_UID,
  ANALYTICS_HOURS_BY_TEMPLATE_WIDGET_UID,
  ANALYTICS_PAGE_LAYOUT_TAB_UID,
  ANALYTICS_PAGE_LAYOUT_UID,
  ANALYTICS_PAGE_LAYOUT_WIDGET_UID,
  ANALYTICS_STATUS_CHART_WIDGET_UID,
  ANALYTICS_TOTAL_HOURS_WIDGET_UID,
  SHIFT_NAME_FIELD_UID,
  SHIFT_OBJECT_UID,
  SHIFT_STATUS_FIELD_UID,
  SHIFT_TEMPLATE_CODE_SNAPSHOT_FIELD_UID,
  SHIFT_WORKING_MINUTES_FIELD_UID,
} from '../constants/universal-identifiers';

// Two tabs on purpose. Coverage is the fork's 24/7 matrix and reads the team
// roster through an app route, so every member sees it. The Charts tab is host
// GRAPH widgets, which query `shift` with the VIEWER's own permissions — after
// the DEPLOY.md step that strips member read on shift, only Leader/PO see
// numbers there. Coverage stays first so that is what a member lands on.
export default definePageLayout({
  universalIdentifier: ANALYTICS_PAGE_LAYOUT_UID,
  name: 'Shift Analytics',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: ANALYTICS_PAGE_LAYOUT_TAB_UID,
      title: 'Coverage',
      position: 0,
      icon: 'IconChartBar',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ANALYTICS_PAGE_LAYOUT_WIDGET_UID,
          title: '24/7 coverage',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: ANALYTICS_FRONT_COMPONENT_UID,
          },
        },
      ],
    },
    {
      universalIdentifier: ANALYTICS_CHARTS_TAB_UID,
      title: 'Charts',
      position: 1,
      icon: 'IconChartPie',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        {
          universalIdentifier: ANALYTICS_TOTAL_HOURS_WIDGET_UID,
          title: 'Total working minutes',
          type: 'GRAPH',
          objectUniversalIdentifier: SHIFT_OBJECT_UID,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 0,
            rowSpan: 1,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'AGGREGATE_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              SHIFT_WORKING_MINUTES_FIELD_UID,
            aggregateOperation: AggregateOperations.SUM,
          },
        },
        {
          universalIdentifier: ANALYTICS_STATUS_CHART_WIDGET_UID,
          title: 'Shifts by status',
          type: 'GRAPH',
          objectUniversalIdentifier: SHIFT_OBJECT_UID,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 0,
            column: 4,
            rowSpan: 2,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'PIE_CHART',
            aggregateFieldMetadataUniversalIdentifier: SHIFT_NAME_FIELD_UID,
            aggregateOperation: AggregateOperations.COUNT,
            groupByFieldMetadataUniversalIdentifier: SHIFT_STATUS_FIELD_UID,
            displayLegend: true,
          },
        },
        {
          universalIdentifier: ANALYTICS_HOURS_BY_TEMPLATE_WIDGET_UID,
          title: 'Working minutes by shift',
          type: 'GRAPH',
          objectUniversalIdentifier: SHIFT_OBJECT_UID,
          position: {
            layoutMode: PageLayoutTabLayoutMode.GRID,
            row: 1,
            column: 0,
            rowSpan: 1,
            columnSpan: 4,
          },
          configuration: {
            configurationType: 'BAR_CHART',
            aggregateFieldMetadataUniversalIdentifier:
              SHIFT_WORKING_MINUTES_FIELD_UID,
            aggregateOperation: AggregateOperations.SUM,
            primaryAxisGroupByFieldMetadataUniversalIdentifier:
              SHIFT_TEMPLATE_CODE_SNAPSHOT_FIELD_UID,
            layout: 'VERTICAL',
          },
        },
      ],
    },
  ],
});
