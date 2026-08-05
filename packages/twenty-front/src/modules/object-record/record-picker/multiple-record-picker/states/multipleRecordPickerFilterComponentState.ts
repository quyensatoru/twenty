import { MultipleRecordPickerComponentInstanceContext } from '@/object-record/record-picker/multiple-record-picker/states/contexts/MultipleRecordPickerComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { type ObjectRecordFilterInput } from '~/generated/graphql';

// Extra structured filter (e.g. app-scoping) merged into every search this
// picker instance runs, on top of the free-text search box. Undefined means
// no restriction — set once when the picker opens, read on every subsequent
// as-you-type search via useMultipleRecordPickerPerformSearch.
export const multipleRecordPickerFilterComponentState =
  createAtomComponentState<ObjectRecordFilterInput | undefined>({
    key: 'multipleRecordPickerFilterComponentState',
    defaultValue: undefined,
    componentInstanceContext: MultipleRecordPickerComponentInstanceContext,
  });
