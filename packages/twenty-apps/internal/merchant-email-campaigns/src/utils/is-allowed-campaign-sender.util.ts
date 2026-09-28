// CAMPAIGN_SENDERS is a comma-separated list of member emails, or `*` for
// every member. Holders of the Applications permission are always allowed, so
// the app is never locked out when the variable is left empty.
export const isAllowedCampaignSender = ({
  email,
  permissionFlags,
  allowedSenders,
}: {
  email: string | null | undefined;
  permissionFlags: string[];
  allowedSenders: string | undefined;
}): boolean => {
  if (permissionFlags.includes('APPLICATIONS')) {
    return true;
  }

  const allowed = (allowedSenders ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== '');

  if (allowed.includes('*')) {
    return true;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  return (
    normalizedEmail !== undefined &&
    normalizedEmail !== '' &&
    allowed.includes(normalizedEmail)
  );
};
