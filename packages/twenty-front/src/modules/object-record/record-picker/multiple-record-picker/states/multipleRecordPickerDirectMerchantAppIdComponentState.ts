import { MultipleRecordPickerComponentInstanceContext } from '@/object-record/record-picker/multiple-record-picker/states/contexts/MultipleRecordPickerComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

// When set, this picker instance is scoped to merchants of this app id and
// searches the merchant object directly (see searchMerchantsByAppId) instead
// of going through the generic multi-object search endpoint — merchant's
// appId isn't part of that endpoint's shared filter type, so the generic
// path would otherwise require crawling every merchant id for the app
// client-side, which doesn't scale past a few thousand merchants.
// Undefined means this picker isn't merchant-scoped.
export const multipleRecordPickerDirectMerchantAppIdComponentState =
  createAtomComponentState<string | undefined>({
    key: 'multipleRecordPickerDirectMerchantAppIdComponentState',
    defaultValue: undefined,
    componentInstanceContext: MultipleRecordPickerComponentInstanceContext,
  });
