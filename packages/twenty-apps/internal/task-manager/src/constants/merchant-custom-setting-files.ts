// The FILES field's own cap, enforced by the host picker and by the engine,
// which refuses a FILES field that does not declare one. It bounds how many
// uploads one merchant can accumulate across every FILE setting and tool run,
// since a replaced file is not deleted.
export const MERCHANT_CUSTOM_SETTING_FILES_MAX = 60;
