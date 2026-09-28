export const MERCHANT_BASE_SELECTION = {
  id: true,
  name: true,
  appId: true,
  app: { name: true },
  contactName: true,
  email: { primaryEmail: true },
  emailUnsubscribed: true,
} as const;
