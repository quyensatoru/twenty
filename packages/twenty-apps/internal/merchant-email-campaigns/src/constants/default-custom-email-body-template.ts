// Matches the in-house email service the MIDA backend already calls, so
// switching the app to it needs only the endpoint and headers.
export const DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE = {
  toAddress: '{{to}}',
  htmlData: '{{html}}',
  subject: '{{subject}}',
  sourceEmail: '{{fromEmail}}',
  replyToAddress: '{{replyTo}}',
  domain: '{{shopDomain}}',
  oTag: '{{campaignName}}',
};
