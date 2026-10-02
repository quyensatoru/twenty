import { styled } from '@linaria/react';
import { Suspense, lazy } from 'react';

import { isDefined } from 'twenty-shared/utils';

import { FrontComponentSkeletonLoader } from '@/front-components/components/FrontComponentSkeletonLoader';
import { usePageLayoutContentContext } from '@/page-layout/contexts/PageLayoutContentContext';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { PageLayoutWidgetNoDataDisplay } from '@/page-layout/widgets/components/PageLayoutWidgetNoDataDisplay';
import { isWidgetConfigurationOfType } from '@/side-panel/pages/page-layout/utils/isWidgetConfigurationOfType';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';

// No border of its own. StyledWidgetContentFrame drew one around every front
// component, and no other widget type has one — a FIELDS widget beside this one
// on the same record page sits on the card with nothing around it, so an app
// panel next to it read as a box bolted onto the page. The containment that
// frame existed for is the sizing and the overflow rule below, both kept.
const StyledContainer = styled.div<{
  isInEditMode: boolean;
  isSoloLayout: boolean;
}>`
  box-sizing: border-box;
  height: var(--widget-height, 100%);
  overflow: var(
    --widget-scroll-overflow,
    ${({ isSoloLayout }) => (isSoloLayout ? 'visible' : 'auto')}
  );
  pointer-events: ${({ isInEditMode }) => (isInEditMode ? 'none' : 'auto')};
  width: 100%;
`;

const FrontComponentRenderer = lazy(() =>
  import('@/front-components/components/FrontComponentRenderer').then(
    (module) => ({ default: module.FrontComponentRenderer }),
  ),
);

type FrontComponentWidgetRendererProps = {
  widget: PageLayoutWidget;
};

export const FrontComponentWidgetRenderer = ({
  widget,
}: FrontComponentWidgetRendererProps) => {
  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();
  const { presentation } = usePageLayoutContentContext();
  const { targetRecordIdentifier } = useLayoutRenderingContext();

  const configuration = widget.configuration;

  if (
    !isDefined(configuration) ||
    !isWidgetConfigurationOfType(configuration, 'FrontComponentConfiguration')
  ) {
    return <PageLayoutWidgetNoDataDisplay />;
  }

  const frontComponentId = configuration.frontComponentId;
  const selectedRecordIds = isDefined(targetRecordIdentifier?.id)
    ? [targetRecordIdentifier.id]
    : undefined;

  return (
    <StyledContainer
      isInEditMode={isPageLayoutInEditMode}
      isSoloLayout={presentation === 'solo'}
    >
      <Suspense fallback={<FrontComponentSkeletonLoader />}>
        <FrontComponentRenderer
          frontComponentId={frontComponentId}
          selectedRecordIds={selectedRecordIds}
          objectNameSingular={targetRecordIdentifier?.targetObjectNameSingular}
          loadingFallback={<FrontComponentSkeletonLoader />}
        />
      </Suspense>
    </StyledContainer>
  );
};
