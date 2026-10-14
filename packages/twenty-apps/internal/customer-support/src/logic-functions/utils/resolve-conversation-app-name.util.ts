import {
  CRISP_APP_SESSION_FLAGS,
  CRISP_SHARED_WEBSITE_APP_NAMES,
  CRISP_WEBSITE_APP_NAMES,
  type CrispWebsiteAppName,
} from '../../constants/crisp';

const isCrispWebsiteAppName = (
  appName: string,
): appName is CrispWebsiteAppName =>
  CRISP_WEBSITE_APP_NAMES.some((candidate) => candidate === appName);

const isFlagSet = (
  sessionData: Record<string, unknown>,
  appName: CrispWebsiteAppName,
): boolean => {
  const value = sessionData[CRISP_APP_SESSION_FLAGS[appName]];

  return value === true || value === 'true';
};

// The product a chat is about. A shop that uses both products of a shared
// website carries both flags; the website's own product wins then, as it does
// when the session says nothing.
export const resolveConversationAppName = (
  websiteAppName: string,
  sessionData: Record<string, unknown> | null | undefined,
): string => {
  if (
    !isCrispWebsiteAppName(websiteAppName) ||
    sessionData === null ||
    sessionData === undefined
  ) {
    return websiteAppName;
  }

  if (isFlagSet(sessionData, websiteAppName)) {
    return websiteAppName;
  }

  return (
    (CRISP_SHARED_WEBSITE_APP_NAMES[websiteAppName] ?? []).find((appName) =>
      isFlagSet(sessionData, appName),
    ) ?? websiteAppName
  );
};
