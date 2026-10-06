import { t } from 'twenty-sdk/front-component';

import { StudioButton } from './studio-button';
import { StudioPanel } from './studio-panel';
import { STUDIO_TOKENS } from './studio-tokens';

type EmailGuidePanelProps = {
  onGoToTemplates: () => void;
  onGoToCampaigns: () => void;
};

const sectionText = {
  color: STUDIO_TOKENS.textSecondary,
  fontSize: 13,
  lineHeight: 1.55,
  margin: 0,
} as const;

const stepNumber = {
  alignItems: 'center',
  background: STUDIO_TOKENS.accentSoft,
  borderRadius: 999,
  color: STUDIO_TOKENS.accent,
  display: 'inline-flex',
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 700,
  height: 24,
  justifyContent: 'center',
  width: 24,
} as const;

const stepHeader = {
  alignItems: 'center',
  display: 'flex',
  gap: 8,
} as const;

const bulletList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  margin: 0,
  paddingLeft: 18,
} as const;

export const EmailGuidePanel = ({
  onGoToTemplates,
  onGoToCampaigns,
}: EmailGuidePanelProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StudioPanel
        title={t('How it works in 3 steps')}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <StudioButton variant="ghost" onClick={onGoToTemplates}>
              {t('Open Templates')}
            </StudioButton>
            <StudioButton variant="ghost" onClick={onGoToCampaigns}>
              {t('Open Campaigns')}
            </StudioButton>
          </div>
        }
      >
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={stepHeader}>
              <span style={stepNumber}>1</span>
              <strong
                style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}
              >
                {t('Design the email')}
              </strong>
            </div>
            <p style={sectionText}>
              {t(
                'Go to Templates, make one email with blocks. No HTML needed.',
              )}
            </p>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={stepHeader}>
              <span style={stepNumber}>2</span>
              <strong
                style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}
              >
                {t('Choose who receives it')}
              </strong>
            </div>
            <p style={sectionText}>
              {t(
                'Go to Campaigns, pick the template, filter by app, install status, plan and country, then press Estimate audience.',
              )}
            </p>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={stepHeader}>
              <span style={stepNumber}>3</span>
              <strong
                style={{ color: STUDIO_TOKENS.textPrimary, fontSize: 13 }}
              >
                {t('Send and check results')}
              </strong>
            </div>
            <p style={sectionText}>
              {t(
                'Send a test to yourself first, then Send now, Schedule or Activate. Watch the Results panel and Send log.',
              )}
            </p>
          </div>
        </div>
      </StudioPanel>

      <StudioPanel
        title={t('Step 1: make the template')}
        actions={
          <StudioButton variant="ghost" onClick={onGoToTemplates}>
            {t('Open Templates')}
          </StudioButton>
        }
      >
        <ul style={bulletList}>
          <li style={sectionText}>
            {t(
              'Templates tab -> New template. Fill Template name (only your team sees it), Subject, and Preview text shown after the subject in the inbox.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Stay in Block editor. Add block -> Heading, Text, Button, Image, Divider, Spacer. Click a block on the left to edit it in the middle, preview on the right.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Use the + variable buttons instead of typing. Example: Hi {{contactName|there}}, shows Hi there when the name is missing.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Type your test address at the top, press Send test, check on phone and computer, then press Save.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'The unsubscribe link is added automatically at the bottom. Do not remove it.',
            )}
          </li>
        </ul>
      </StudioPanel>

      <StudioPanel
        title={t('Step 2: make the campaign')}
        actions={
          <StudioButton variant="ghost" onClick={onGoToCampaigns}>
            {t('Open Campaigns')}
          </StudioButton>
        }
      >
        <p style={sectionText}>
          <strong style={{ color: STUDIO_TOKENS.textPrimary }}>
            {t('Broadcast = send once.')}
          </strong>{' '}
          {t(
            'Example: announce a feature to every installed MIDA merchant. You press Send now or Schedule.',
          )}
        </p>
        <p style={sectionText}>
          <strong style={{ color: STUDIO_TOKENS.textPrimary }}>
            {t('Automation = send automatically.')}
          </strong>{' '}
          {t(
            'Example: a win-back offer 3 days after uninstall. You press Activate, then every matching event sends it.',
          )}
        </p>
        <ul style={bulletList}>
          <li style={sectionText}>
            {t(
              'Setup: pick the Template, leave From empty to use the company default. Fill Reply-To only if replies should go elsewhere.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Automation only: pick Send when this event arrives (merchant.installed, merchant.uninstalled, plan changes, or a custom event name). Delay 0 sends right away, 1440 = one day, 4320 = three days. Keep Send at most once per merchant on.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Broadcast only: Scheduled for is only used by Schedule. Send now ignores it.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Audience: tick Apps (empty = every app), Install status, Shopify plans, Pricing plans, Countries. Always press Estimate audience and look at the sample shops.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Shops without an email or who unsubscribed are always left out, even if they match the filter.',
            )}
          </li>
        </ul>
      </StudioPanel>

      <StudioPanel title={t('Step 3: send and read results')}>
        <ul style={bulletList}>
          <li style={sectionText}>
            {t(
              'Draft broadcast shows Send now and Schedule. Scheduled broadcast shows Send now and Cancel. Sending broadcast shows Pause sending. Paused shows Resume sending and Cancel.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Draft automation shows Activate. Active automation shows Pause. Paused shows Resume and Archive. Archived or canceled campaigns cannot be reactivated.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Results panel: Sent = delivered to provider, Failed = provider refused (see Recent failures), Skipped = no email, unsubscribed, or already emailed by this campaign.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Every message is logged under Email Marketing → Send log, and on the merchant record.',
            )}
          </li>
        </ul>
      </StudioPanel>

      <StudioPanel title={t('Variables you can use')}>
        <p style={sectionText}>
          {t(
            'Click a + button to insert. They work in subject, text, and button links.',
          )}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            '{{storeName}}',
            '{{contactName}}',
            '{{contactName|there}}',
            '{{appName}}',
            '{{shopDomain}}',
            '{{shopifyPlan}}',
            '{{pricingPlan}}',
            '{{country}}',
            '{{currentYear}}',
          ].map((variable) => (
            <code
              key={variable}
              style={{
                background: STUDIO_TOKENS.backgroundTertiary,
                borderRadius: STUDIO_TOKENS.radiusSmall,
                color: STUDIO_TOKENS.textPrimary,
                fontSize: 12,
                padding: '2px 8px',
              }}
            >
              {variable}
            </code>
          ))}
        </div>
        <p style={sectionText}>
          {t(
            'Automations also carry what changed: {{event.oldShopifyPlan}} / {{event.newShopifyPlan}}, {{event.oldPricingPlan}} / {{event.newPricingPlan}}, {{event.oldEmail}} / {{event.newEmail}}.',
          )}
        </p>
      </StudioPanel>

      <StudioPanel title={t('Checklist before you press send')}>
        <ul style={bulletList}>
          <li style={sectionText}>{t('Subject is filled and honest.')}</li>
          <li style={sectionText}>
            {t('Estimate audience shows the number you expect.')}
          </li>
          <li style={sectionText}>
            {t('You received the test email and links work.')}
          </li>
          <li style={sectionText}>
            {t('Automation: event name shows Received, not Never received.')}
          </li>
          <li style={sectionText}>
            {t('Broadcast: send time is in the future when scheduling.')}
          </li>
        </ul>
      </StudioPanel>

      <StudioPanel title={t('If something looks wrong')}>
        <ul style={bulletList}>
          <li style={sectionText}>
            {t(
              'Send button is grey or nothing happens: add a Template, a Subject, and check Estimate audience is not zero.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Last error about From or domain: ask IT to check the sending domain and DEFAULT_FROM_EMAIL. Do not change variables yourself.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'Paused with all failed: the email provider key or domain is wrong. Copy Last error to IT.',
            )}
          </li>
          <li style={sectionText}>
            {t(
              'A shop says they unsubscribed by mistake: they can reopen the unsubscribe link in an email from the last 30 days and tick the topics again. Bounces and spam complaints cannot be undone.',
            )}
          </li>
        </ul>
      </StudioPanel>
    </div>
  );
};
