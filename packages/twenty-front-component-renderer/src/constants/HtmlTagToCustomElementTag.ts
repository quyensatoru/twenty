import { ALLOWED_HTML_ELEMENTS } from '@/constants/AllowedHtmlElements';
import { UTILITY_COMPONENT_ELEMENTS } from '@/constants/UtilityComponentElements';
import { getHostTagName } from '@/utils/getHostTagName';

// The SDK's JSX runtime wrapper reads this map to turn a tag written in a front
// component into the custom element the worker renders. Utility components map
// to themselves: they are already written under their custom element name.
export const HTML_TAG_TO_CUSTOM_ELEMENT_TAG: Record<string, string> = {
  ...Object.fromEntries(
    ALLOWED_HTML_ELEMENTS.map((element) => [
      getHostTagName(element),
      element.tag,
    ]),
  ),
  ...Object.fromEntries(
    UTILITY_COMPONENT_ELEMENTS.filter(
      (element) => element.isExposedToFrontComponentJsx,
    ).map((element) => [element.tag, element.tag]),
  ),
};
