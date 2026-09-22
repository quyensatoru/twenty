import { UPSELL_DEAL_STAGE_OPTIONS } from './pipeline-stages';

// The apps this team sells, and the only apps that need to be named in code.
// Each entry gives one app a value in `prospect.ourApps` and its own stage
// column on the prospect list, both of which are metadata and so cannot be
// created at runtime (see the README).
//
// Every OTHER app a shop runs — EU, FRAUD, a third party, anything the merchant
// sync or a CSV brings in — lands in `prospect.otherApps`, a plain text list
// that accepts any name with no deploy. Nothing is ever dropped for being
// unknown; the only thing a new app cannot do is get its own stage column.
//
// Selling a new app later: add an entry here with fresh UUIDs and deploy. The
// sync moves shops already running it out of otherApps on its next run.
//
// Keys must match the `app` registry names once normalised through toAppKey,
// and no key may be a prefix of another (MULTI_SELECT filters compare
// case-insensitively with %value%).
export const SELLABLE_APPS = [
  {
    optionId: '5bb28f60-5e3c-45de-a061-b592c61b3e09',
    key: 'BLOY',
    label: 'BLOY',
    position: 0,
    color: 'blue',
    stage: {
      fieldUniversalIdentifier: 'fa05f887-4855-4b63-bda6-fc326ded89e1',
      name: 'bloyStage',
      label: 'BLOY stage',
      optionIds: [
        'a3b0ca20-4744-4b7f-a575-11db127188f3',
        '091de355-4981-42c6-a595-776ba7de3b3a',
        '857897b1-6059-4bf3-ab8f-7d1b71c42ec0',
        'd06eb64a-c29a-4784-9c2f-86ba063d94ac',
        '8a8ad33d-66c9-44a8-8800-e47fc798bdba',
        'afd61766-5e1d-493f-8073-007c84902118',
        'e62f1d32-3791-45ba-9c32-dce5a3dadf33',
        '016abd24-44eb-4887-8ce5-39fb3a69a90e',
      ],
      allProspectsViewFieldUniversalIdentifier:
        'd8a3b654-a446-45f1-8f5a-bbed8fbcf377',
      noDealViewFieldUniversalIdentifier:
        'd1dfbeac-434e-4d93-abb5-82d71bd5f65b',
      noDealViewFilterUniversalIdentifier:
        'ac76de9e-5952-4dda-8284-0c5f0fc70036',
    },
  },
  {
    optionId: '80c80453-f186-4524-a8dd-478ad04711a8',
    key: 'MIDA',
    label: 'MIDA',
    position: 1,
    color: 'purple',
    stage: {
      fieldUniversalIdentifier: '4799edf8-8839-4766-b52b-ce89dc16ba60',
      name: 'midaStage',
      label: 'MIDA stage',
      optionIds: [
        '1ea67a8e-de74-4924-9671-5eda26f6d0e1',
        '5d14d4f2-f7b0-4c3b-8789-f6f88c3d1f82',
        '41d9ed7a-3da7-411a-838b-86643f7f3d33',
        'b15930c3-22dd-444d-9a4d-14522a116ca3',
        '3bb73cae-d0e6-44f2-acec-cd289557d054',
        '9373f124-f19c-4009-a002-30023dd88663',
        'c876fdc6-123e-4427-a77f-0bdf73fbf991',
        '40ab211e-61ff-48ab-adbf-b864a60e965e',
      ],
      allProspectsViewFieldUniversalIdentifier:
        '55092fc0-2bd6-4f52-9904-0250bf42a558',
      noDealViewFieldUniversalIdentifier:
        '2acdfd3b-7ac1-4079-889f-4c09a79456f2',
      noDealViewFilterUniversalIdentifier:
        '7e9a9cf2-0bd9-4f9c-82f8-adf4c2677cff',
    },
  },
] as const;

export type SellableApp = (typeof SELLABLE_APPS)[number];

export const SELLABLE_APP_KEYS: string[] = SELLABLE_APPS.map((app) => app.key);

export const isSellableAppKey = (appKey: string): boolean =>
  SELLABLE_APP_KEYS.includes(appKey);

export const OUR_APPS_OPTIONS = SELLABLE_APPS.map((app) => ({
  id: app.optionId,
  value: app.key,
  label: app.label,
  position: app.position,
  color: app.color,
}));

// Each app's stage column reuses the pipeline's own stages, so a column reads
// exactly like the Kanban it mirrors. Option ids have to be distinct per field,
// hence the per-app list above.
export const buildStageOptionsForApp = (app: SellableApp) =>
  UPSELL_DEAL_STAGE_OPTIONS.map((stage, index) => ({
    id: app.stage.optionIds[index],
    value: stage.value,
    label: stage.label,
    position: stage.position,
    color: stage.color,
  }));
