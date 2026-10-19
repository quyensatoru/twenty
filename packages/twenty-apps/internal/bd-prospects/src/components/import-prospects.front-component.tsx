import { defineFrontComponent } from 'twenty-sdk/define';

import { IMPORT_WIZARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { ProspectImportPage } from '../front-components/components/prospect-import-page';

export default defineFrontComponent({
  universalIdentifier: IMPORT_WIZARD_FRONT_COMPONENT_UID,
  name: 'import-prospects',
  description:
    'CSV import wizard for BD prospects: validate, preview new/updated/error counts, then write.',
  component: ProspectImportPage,
});
