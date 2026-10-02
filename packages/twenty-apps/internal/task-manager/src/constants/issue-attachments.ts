// The FILES field's own cap, enforced by the host picker. It also bounds how
// many pasted image URLs one issue can turn into stored files, since every
// upload the composer makes is filed against this same field. Set to the
// engine maximum because the cutover folds every fork attachment of an issue
// and its comments into this field, up to 49 on production.
export const ISSUE_ATTACHMENTS_MAX_VALUES = 60;
