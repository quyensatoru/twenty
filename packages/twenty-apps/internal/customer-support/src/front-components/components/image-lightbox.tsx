import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';

import { INBOX_CIRCLE_STYLE } from './inbox-tokens';

type ImageLightboxProps = {
  url: string;
  alt: string;
  onClose: () => void;
};

// Full-screen preview of a chat image. Viewing never leaves the inbox: Crisp
// serves attachments with a download disposition, so opening the URL saves a
// file instead of showing it.
export const ImageLightbox = ({ url, alt, onClose }: ImageLightboxProps) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label={alt === '' ? t('Image preview') : alt}
    tabIndex={-1}
    ref={(element) => element?.focus()}
    onClick={onClose}
    onKeyDown={(event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    }}
    style={{
      alignItems: 'center',
      background: 'rgba(9, 11, 15, 0.82)',
      backdropFilter: 'blur(4px)',
      cursor: 'zoom-out',
      display: 'flex',
      inset: 0,
      justifyContent: 'center',
      outline: 'none',
      padding: 32,
      position: 'fixed',
      zIndex: 1000,
    }}
  >
    <img
      src={url}
      alt={alt}
      onClick={(event) => event.stopPropagation()}
      style={{
        borderRadius: 12,
        boxShadow: '0 24px 64px rgba(0,0,0,.45)',
        cursor: 'default',
        maxHeight: '100%',
        maxWidth: '100%',
        objectFit: 'contain',
      }}
    />
    <button
      type="button"
      aria-label={t('Close')}
      onClick={onClose}
      style={{
        ...INBOX_CIRCLE_STYLE,
        alignItems: 'center',
        background: 'rgba(255,255,255,.14)',
        border: 'none',
        color: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        height: 36,
        justifyContent: 'center',
        position: 'absolute',
        right: 20,
        top: 20,
        width: 36,
      }}
    >
      <IconX size={18} />
    </button>
  </div>
);
