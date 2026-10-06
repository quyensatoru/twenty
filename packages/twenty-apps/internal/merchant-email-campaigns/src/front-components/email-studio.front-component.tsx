import { t } from 'twenty-sdk/front-component';
import { useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';

import { EMAIL_STUDIO_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type CampaignRow } from '../types/campaign-row';
import { type TemplateRow } from '../types/template-row';
import { CampaignEditor } from './components/campaign-editor';
import { CampaignList } from './components/campaign-list';
import { EmailGuidePanel } from './components/email-guide-panel';
import { IntegrationsPanel } from './components/integrations-panel';
import { StudioButton } from './components/studio-button';
import { StudioSegmentedControl } from './components/studio-segmented-control';
import { STUDIO_TOKENS } from './components/studio-tokens';
import { TemplateEditor } from './components/template-editor';
import { TemplateList } from './components/template-list';
import { listApps } from './utils/list-apps.util';
import { listCampaigns } from './utils/list-campaigns.util';
import { listTemplates } from './utils/list-templates.util';
import { readErrorText } from './utils/read-error-text.util';

type StudioSection = 'campaigns' | 'templates' | 'integrations' | 'guide';

type StudioScreen =
  | { kind: 'list' }
  | { kind: 'campaign'; campaignId: string }
  | { kind: 'template'; templateId: string };

const EmailStudio = () => {
  const [section, setSection] = useState<StudioSection>('campaigns');
  const [screen, setScreen] = useState<StudioScreen>({ kind: 'list' });
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = async () => {
    try {
      const [nextCampaigns, nextTemplates] = await Promise.all([
        listCampaigns(),
        listTemplates(),
      ]);

      setCampaigns(nextCampaigns);
      setTemplates(nextTemplates);
      setLoadError(null);
    } catch (error) {
      setLoadError(readErrorText(error));
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await reload();

      try {
        setApps(await listApps());
      } catch {
        setApps([]);
      }

      setIsLoading(false);
    };

    void load();
  }, []);

  const openSection = (nextSection: StudioSection) => {
    setSection(nextSection);
    setScreen({ kind: 'list' });
  };

  const openTemplate = (templateId: string) => {
    setSection('templates');
    setScreen({ kind: 'template', templateId });
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <p style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 13 }}>
          {t('Loading…')}
        </p>
      );
    }

    if (loadError !== null) {
      return (
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <p
            style={{ color: STUDIO_TOKENS.textDanger, fontSize: 13, margin: 0 }}
          >
            {loadError}
          </p>
          <StudioButton onClick={() => void reload()}>Retry</StudioButton>
        </div>
      );
    }

    if (screen.kind === 'campaign') {
      const campaign = campaigns.find((item) => item.id === screen.campaignId);

      return campaign === undefined ? (
        <p style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 13 }}>
          {t('This campaign no longer exists.')}
        </p>
      ) : (
        <CampaignEditor
          key={`${campaign.id}:${campaign.status}`}
          campaign={campaign}
          templates={templates}
          apps={apps}
          onBack={() => setScreen({ kind: 'list' })}
          onChanged={reload}
          onOpenTemplate={openTemplate}
        />
      );
    }

    if (screen.kind === 'template') {
      const template = templates.find((item) => item.id === screen.templateId);

      return template === undefined ? (
        <p style={{ color: STUDIO_TOKENS.textSecondary, fontSize: 13 }}>
          {t('This template no longer exists.')}
        </p>
      ) : (
        <TemplateEditor
          key={template.id}
          template={template}
          onBack={() => setScreen({ kind: 'list' })}
          onSaved={(saved) =>
            setTemplates((current) =>
              current.map((item) => (item.id === saved.id ? saved : item)),
            )
          }
        />
      );
    }

    if (section === 'integrations') {
      return <IntegrationsPanel />;
    }

    if (section === 'guide') {
      return (
        <EmailGuidePanel
          onGoToTemplates={() => openSection('templates')}
          onGoToCampaigns={() => openSection('campaigns')}
        />
      );
    }

    return section === 'campaigns' ? (
      <CampaignList
        campaigns={campaigns}
        templates={templates}
        onOpen={(campaignId) => setScreen({ kind: 'campaign', campaignId })}
        onChanged={reload}
      />
    ) : (
      <TemplateList
        templates={templates}
        onOpen={openTemplate}
        onChanged={reload}
      />
    );
  };

  return (
    <main
      style={{
        background: STUDIO_TOKENS.backgroundSecondary,
        boxSizing: 'border-box',
        color: STUDIO_TOKENS.textPrimary,
        display: 'grid',
        fontFamily: STUDIO_TOKENS.fontFamily,
        gap: 16,
        gridTemplateRows: 'auto minmax(0, 1fr)',
        height: '100%',
        minHeight: '100%',
        overflow: 'hidden',
        padding: 16,
        width: '100%',
      }}
    >
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
            {t('Email Studio')}
          </h1>
          <span style={{ color: STUDIO_TOKENS.textTertiary, fontSize: 12 }}>
            {t(
              'Campaigns to merchants, triggered by install status or sent as broadcasts.',
            )}
          </span>
        </div>
        <StudioSegmentedControl
          value={section}
          options={[
            { value: 'campaigns', label: 'Campaigns' },
            { value: 'templates', label: 'Templates' },
            { value: 'integrations', label: 'Integrations' },
            { value: 'guide', label: 'Guide' },
          ]}
          onChange={openSection}
        />
      </header>
      <div style={{ minHeight: 0, overflow: 'auto' }}>{renderBody()}</div>
    </main>
  );
};

export default defineFrontComponent({
  universalIdentifier: EMAIL_STUDIO_FRONT_COMPONENT_UID,
  name: 'email-studio',
  description:
    'Email Studio: build templates with a block editor and run merchant campaigns.',
  component: EmailStudio,
});
