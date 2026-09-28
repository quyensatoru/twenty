import { t } from 'twenty-sdk/front-component';

import { TEMPLATE_VARIABLE_DEFINITIONS } from '../../constants/template-variable-definitions';
import { StudioTagButton } from './studio-tag-button';

type VariableChipsProps = {
  onInsert: (placeholder: string) => void;
};

// Appends at the end of the field: the sandboxed renderer does not expose the
// caret position, so inserting mid-text is not possible from here.
export const VariableChips = ({ onInsert }: VariableChipsProps) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
    {TEMPLATE_VARIABLE_DEFINITIONS.map((definition) => (
      <StudioTagButton
        key={definition.key}
        tone="accent"
        title={t('Example: {sample}', { sample: definition.sample })}
        onClick={() => onInsert(`{{${definition.key}}}`)}
      >
        {`+ ${t(definition.label)}`}
      </StudioTagButton>
    ))}
  </div>
);
