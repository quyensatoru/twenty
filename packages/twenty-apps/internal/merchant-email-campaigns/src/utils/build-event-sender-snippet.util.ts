// The same call the MIDA backend makes to Brevo today, pointed at this app:
// only the URL and the key's environment variable change. The snippet must not
// hold a line starting with a // comment: the front-component build strips
// those even inside a template literal, closing backtick included.
export const buildEventSenderSnippet = (
  eventsUrl: string,
): string => `const res = await fetch('${eventsUrl}', {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'api-key': process.env.TWENTY_EVENTS_API_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    event_name: 'trial_ending',
    identifiers: { email_id: 'owner@shop.com' },
    contact_properties: { DOMAIN: 'shop.myshopify.com', APP: 'MIDA', FIRSTNAME: 'Linh' },
    event_properties: { days_left: 3 },
  }),
});`;
