import { type MerchantRow } from '../types/merchant-row';
import { type TemplateVariables } from '../types/template-variables';

export const buildTemplateVariables = ({
  merchant,
  appName,
  unsubscribeUrl,
  now = new Date(),
}: {
  merchant: MerchantRow;
  appName: string;
  unsubscribeUrl: string;
  now?: Date;
}): TemplateVariables => {
  const shopDomain = merchant.name?.trim() ?? '';
  const storeName = merchant.storeName?.trim() || shopDomain;

  return {
    shopDomain,
    storeName,
    contactName: merchant.contactName?.trim() ?? '',
    email: merchant.email?.primaryEmail?.trim() ?? '',
    appName,
    shopifyPlan: merchant.shopifyPlan ?? '',
    pricingPlan: merchant.pricingPlan ?? '',
    country: merchant.country ?? '',
    unsubscribeUrl,
    currentYear: String(now.getUTCFullYear()),
  };
};
