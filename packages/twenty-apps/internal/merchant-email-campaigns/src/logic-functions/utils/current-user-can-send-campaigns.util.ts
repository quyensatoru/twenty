import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { CAMPAIGN_SENDERS_VARIABLE } from '../../constants/application-variable-names';
import { isAllowedCampaignSender } from '../../utils/is-allowed-campaign-sender.util';

// Runs inside an authenticated route, where the metadata client carries the
// caller's token, so `currentUser` is the member who clicked.
export const currentUserCanSendCampaigns = async (): Promise<boolean> => {
  const { currentUser } = await new MetadataApiClient().query({
    currentUser: {
      email: true,
      currentUserWorkspace: { permissionFlags: true },
    },
  });

  return isAllowedCampaignSender({
    email: currentUser?.email,
    permissionFlags: currentUser?.currentUserWorkspace?.permissionFlags ?? [],
    allowedSenders: process.env[CAMPAIGN_SENDERS_VARIABLE],
  });
};
