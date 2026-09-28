import { getFieldUniversalIdentifier } from 'twenty-sdk/define';

import { APPLICATION_UID } from './universal-identifiers';

// id/createdAt/updatedAt/deletedAt/position/createdBy/updatedBy/searchVector
// are created by the engine for every app object, with an identifier derived
// from (application, object, field name) — they are never declared in an
// object's `fields`. Objects whose label identifier is `id` still have to
// name it, so it is recomputed here with the same helper the engine uses.
export const getSystemFieldUniversalIdentifier = ({
  objectUniversalIdentifier,
  name,
}: {
  objectUniversalIdentifier: string;
  name: string;
}): string =>
  getFieldUniversalIdentifier({
    applicationUniversalIdentifier: APPLICATION_UID,
    objectUniversalIdentifier,
    name,
  });
