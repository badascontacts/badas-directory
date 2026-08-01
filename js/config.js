// ================================================================
// BADAS DIRECTORY — Configuration File
// ================================================================
// STEP 1: Replace YOUR_SHEET_ID_HERE with your Google Sheet ID
// STEP 2: Set USE_SAMPLE_DATA to false
// ================================================================

const CONFIG = {

  // ── STEP 1: Your Google Sheet ID ────────────────────────────────
  // Find it in your Sheet URL:
  // https://docs.google.com/spreadsheets/d/[THIS_PART]/edit
  SHEET_ID: '1c8Z_2ZEUCR-8050H0UE9vTmlCWDSvSyiMrg8eLjmd1w',

  // ── Sheet Tab Names (must match exactly, case-sensitive) ─────────
  ORG_SHEET:       'Organizations',
  CONTACTS_SHEET:  'Contacts',
  EMERGENCY_SHEET: 'Emergency',
  BANNER_SHEET:    'BannerAd',
  SETTINGS_SHEET:  'Settings',

  // ── STEP 2: Switch to your real data ────────────────────────────
  // Set to false after adding your Sheet ID above
  USE_SAMPLE_DATA: false,

  // ── Password (Fallback only) ─────────────────────────────────────
  // PRIMARY password comes from Google Sheet → Settings tab → key: password
  // This is only used if the Sheet is unreachable (offline/first launch)
  PASSWORD: 'BADAS@2024',

  // Hours to stay logged in when "Remember me" is checked
  SESSION_HOURS: 8,

  // Auto-sync interval when online (5 minutes)
  SYNC_INTERVAL_MS: 5 * 60 * 1000,

  // ── App Info ─────────────────────────────────────────────────────
  APP_NAME:    'BADAS Directory',
  APP_VERSION: '2.0.0',

  // ── localStorage Keys (do not change) ───────────────────────────
  STORAGE: {
    ORGS:      'badas_orgs_v2',
    CONTACTS:  'badas_contacts_v2',
    EMERGENCY: 'badas_emergency_v2',
    BANNER:    'badas_banner_v2',
    LAST_SYNC: 'badas_last_sync_v2',
    SESSION:   'badas_session_v1',
    SETTINGS:  'badas_settings_v1',
  },
};
