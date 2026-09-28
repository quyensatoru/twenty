import { type CampaignRow } from '../../types/campaign-row';
import { type MerchantEmailBuildResult } from '../../types/merchant-email-build-result';
import { type MerchantRow } from '../../types/merchant-row';
import { type TemplateRow } from '../../types/template-row';
import { buildMerchantEmail } from '../../utils/build-merchant-email.util';
import { buildResendTags } from '../../utils/build-resend-tags.util';
import { buildListUnsubscribeHeaders } from './build-list-unsubscribe-headers.util';
import { buildUnsubscribeUrl } from './build-unsubscribe-url.util';
import { resolveSender } from './resolve-sender.util';

export const prepareMerchantEmail = ({
  campaign,
  template,
  merchant,
  eventProperties,
}: {
  campaign: CampaignRow;
  template: TemplateRow;
  merchant: MerchantRow;
  eventProperties?: Record<string, string>;
}): MerchantEmailBuildResult => {
  const { from, replyTo } = resolveSender(campaign);
  const unsubscribeUrl = buildUnsubscribeUrl(merchant.id);

  return buildMerchantEmail({
    template,
    merchant,
    appName: merchant.app?.name ?? '',
    unsubscribeUrl,
    from,
    replyTo,
    headers: buildListUnsubscribeHeaders(unsubscribeUrl),
    tags: buildResendTags({
      campaign_id: campaign.id,
      merchant_id: merchant.id,
    }),
    context: { campaignId: campaign.id, campaignName: campaign.name ?? '' },
    eventProperties,
  });
};
