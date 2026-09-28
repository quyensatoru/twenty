import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const hasMerchantBeenEmailed = async ({
  client,
  campaignId,
  merchantId,
}: {
  client: ApiClient;
  campaignId: string;
  merchantId: string;
}): Promise<boolean> => {
  const { emailSends } = await executeWithRetry<{
    emailSends: Connection<{ id: string }>;
  }>(() =>
    client.query({
      emailSends: {
        __args: {
          filter: {
            campaignId: { eq: campaignId },
            merchantId: { eq: merchantId },
            status: { eq: 'SENT' },
          },
          first: 1,
        },
        edges: { node: { id: true } },
      },
    }),
  );

  return (emailSends?.edges?.length ?? 0) > 0;
};
