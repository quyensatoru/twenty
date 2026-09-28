import { t } from 'twenty-sdk/front-component';
import { useState } from 'react';

import { StudioSegmentedControl } from './studio-segmented-control';
import { STUDIO_TOKENS } from './studio-tokens';

type PreviewDevice = 'desktop' | 'mobile';

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: '100%',
  mobile: '375px',
};

type EmailPreviewProps = {
  html: string;
  subject: string;
  previewText: string;
};

// The iframe gets the exact HTML Resend will send. An empty sandbox keeps any
// link in the preview from navigating the studio away.
export const EmailPreview = ({
  html,
  subject,
  previewText,
}: EmailPreviewProps) => {
  const [device, setDevice] = useState<PreviewDevice>('desktop');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
        minHeight: 0,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              color: STUDIO_TOKENS.textPrimary,
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subject || t('No subject')}
          </span>
          <span
            style={{
              color: STUDIO_TOKENS.textTertiary,
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {previewText || t('No preview text')}
          </span>
        </div>
        <StudioSegmentedControl
          value={device}
          options={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'mobile', label: 'Mobile' },
          ]}
          onChange={setDevice}
        />
      </div>
      <div
        style={{
          background: STUDIO_TOKENS.backgroundTertiary,
          borderRadius: STUDIO_TOKENS.radius,
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          minHeight: 420,
          overflow: 'auto',
          padding: 12,
        }}
      >
        <iframe
          title={t('Email preview')}
          srcDoc={html}
          sandbox=""
          style={{
            background: '#ffffff',
            border: 'none',
            borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            height: '100%',
            minHeight: 400,
            width: DEVICE_WIDTHS[device],
          }}
        />
      </div>
    </div>
  );
};
