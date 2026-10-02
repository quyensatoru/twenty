import { t } from 'twenty-sdk/front-component';

import { type EventNameSuggestion } from '../../types/event-name-suggestion';
import { normalizeEventName } from '../../utils/normalize-event-name.util';
import { resolveEventNameStatus } from '../utils/resolve-event-name-status.util';
import { StudioField } from './studio-field';
import { StudioTagButton } from './studio-tag-button';
import { StudioTextInput } from './studio-text-input';
import { STUDIO_TOKENS } from './studio-tokens';

type EventNameFieldProps = {
  value: string;
  suggestions: EventNameSuggestion[];
  isLoadingSuggestions: boolean;
  onChange: (value: string) => void;
};

const MAX_SUGGESTIONS = 12;

export const EventNameField = ({
  value,
  suggestions,
  isLoadingSuggestions,
  onChange,
}: EventNameFieldProps) => {
  const status = resolveEventNameStatus(value, suggestions);
  const normalized = normalizeEventName(value);
  const offered = suggestions
    .filter((suggestion) => suggestion.name !== normalized)
    .slice(0, MAX_SUGGESTIONS);

  const describe = (): { color: string; text: string } => {
    switch (status.kind) {
      case 'EMPTY':
        return {
          color: STUDIO_TOKENS.textTertiary,
          text: t('Pick one below, or type the event another app will post.'),
        };
      case 'BUILT_IN':
        return {
          color: STUDIO_TOKENS.textSecondary,
          text: t('This app raises this event itself when a merchant row changes.'),
        };
      case 'RECEIVED':
        return {
          color: STUDIO_TOKENS.textSecondary,
          text: status.lastReceivedAt === null
            ? t('Received {count} times.', { count: status.receivedCount })
            : t('Received {count} times, last on {date}.', {
                count: status.receivedCount,
                date: new Date(status.lastReceivedAt).toLocaleString(),
              }),
        };
      case 'BOUND_ONLY':
        return {
          color: STUDIO_TOKENS.orange,
          text: t(
            'Never received yet. {count} other automations wait on the same name, so the sender is the part that is missing.',
            { count: status.automationCount },
          ),
        };
      default:
        return {
          color: STUDIO_TOKENS.orange,
          text: status.closestEventName === null
            ? t(
                'Never received. Nothing will send until an app posts this event_name.',
              )
            : t(
                'Never received. Did you mean "{closest}"? Nothing will send until an app posts this exact event_name.',
                { closest: status.closestEventName },
              ),
        };
    }
  };

  const description = describe();
  const closestEventName =
    status.kind === 'UNKNOWN' ? status.closestEventName : null;

  return (
    <StudioField
      label={t('Send when this event arrives')}
      hint={t(
        'Matched on the name, trimmed and lowercased with spaces as underscores. Event properties are available in the template as {{event.<key>}}.',
      )}
    >
      <StudioTextInput
        value={value}
        placeholder="trial_ending"
        onChange={onChange}
      />
      <span style={{ color: description.color, fontSize: 11, lineHeight: 1.4 }}>
        {isLoadingSuggestions ? t('Loading events…') : description.text}
      </span>
      {closestEventName === null ? null : (
        <div>
          <StudioTagButton
            tone="accent"
            onClick={() => onChange(closestEventName)}
          >
            {t('Use "{closest}"', { closest: closestEventName })}
          </StudioTagButton>
        </div>
      )}
      {offered.length === 0 ? null : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {offered.map((suggestion) => (
            <StudioTagButton
              key={suggestion.name}
              title={
                suggestion.isBuiltIn
                  ? t('Raised by this app')
                  : t('Received {count} times', {
                      count: suggestion.receivedCount,
                    })
              }
              onClick={() => onChange(suggestion.name)}
            >
              {suggestion.isBuiltIn ? t(suggestion.label) : suggestion.name}
            </StudioTagButton>
          ))}
        </div>
      )}
    </StudioField>
  );
};
