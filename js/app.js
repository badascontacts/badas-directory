// -- Mojibake Auto-repair (Fixes garbled Bangla text) --------------
function fixMojibake(str) {
  if (!str || typeof str !== 'string') return str || '';
  if (/[\u00C0-\u00FF]/.test(str)) {
    try {
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) { bytes[i] = str.charCodeAt(i) & 0xFF; }
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (decoded && !decoded.includes('\uFFFD') && decoded !== str) return decoded;
    } catch(e) {}
  }
  return str;
}

// ================================================================
// BADAS DIRECTORY -- Main Application
// ================================================================

// -- AUTH / LOCK SCREEN -------------------------------------------
let _failCount = 0;
let _lockUntil = 0;

// -- SESSION: Password-based (permanent until sheet password changes) --
// Saves the password the user entered. On next open, fetches the
// current sheet password and compares -- if still matches, skip login.

function getSavedSessionPassword() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE.SESSION);
    if (!raw) return null;
    const { pw } = JSON.parse(raw);
    return pw || null;
  } catch { return null; }
}

function saveSession(password) {
  // Store the password used to unlock (not expiry-based)
  localStorage.setItem(CONFIG.STORAGE.SESSION,
    JSON.stringify({ pw: password, savedAt: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(CONFIG.STORAGE.SESSION);
}

// Returns true if saved password still matches current correct password
function checkSession(currentCorrectPw) {
  try {
    const saved = getSavedSessionPassword();
    if (!saved || !currentCorrectPw) return false;
    return saved === currentCorrectPw;
  } catch { return false; }
}

function attemptUnlock() {
  if (Date.now() < _lockUntil) {
    const secs = Math.ceil((_lockUntil - Date.now()) / 1000);
    showLockError('Too many attempts. Try again in ' + secs + 's.', false);
    shakeLockCard(); return;
  }
  const inp      = $('lock-password-input');
  const remember = $('lock-remember-chk');
  const entered  = inp ? inp.value.trim() : '';
  if (!entered) { showLockError('Please enter your password.', false); if(inp) inp.focus(); return; }

  // Password priority: Sheet (State.settings) → cached localStorage → config.js fallback
  const correctPw = (State.settings && State.settings.password)
    || (loadCachedSettings() || {}).password
    || CONFIG.PASSWORD
    || '';

  if (entered === correctPw) {
    _failCount = 0;
    hide($('lock-hint-box'));
    saveSession(entered); // ← always save permanently
    hideLockAndStart();
  } else {
    _failCount++;
    if (inp) { inp.value = ''; inp.focus(); }

    // Show hint from sheet after 1st wrong attempt
    const hint = State.settings && State.settings.hint
      ? State.settings.hint
      : (loadCachedSettings() || {}).hint || '';
    if (hint) showLockHint(hint);

    if (_failCount >= 5) {
      _lockUntil = Date.now() + 60000;
      _failCount = 0;
      showLockError('Too many attempts! Locked for 60 seconds.', false);
    } else {
      const left = 5 - _failCount;
      showLockError('Wrong password. ' + left + ' attempt' + (left !== 1 ? 's' : '') + ' remaining.', true);
    }
    shakeLockCard();
  }
}

function showLockError(msg, showHintLink) {
  const el = $('lock-error');
  if (!el) return;
  const nodes = el.childNodes;
  nodes[nodes.length - 1].textContent = ' ' + msg;
  show(el);
}

function showLockHint(hint) {
  const box = $('lock-hint-box');
  const txt = $('lock-hint-text');
  if (!box || !txt) return;
  txt.textContent = fixMojibake(hint);
  show(box);
}

function shakeLockCard() {
  const card = $('lock-card');
  if (!card) return;
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 600);
}

function hideLockAndStart() {
  const lockEl = $('lock-screen');
  if (lockEl) {
    lockEl.classList.add('lock-fade-out');
    setTimeout(() => lockEl.classList.add('hidden'), 450);
  }
  startApp();
}

function setupLockListeners() {
  const btn    = $('lock-unlock-btn');
  const inp    = $('lock-password-input');
  const eyeBtn = $('lock-eye-btn');
  const eyeO   = $('eye-open');
  const eyeC   = $('eye-closed');
  if (btn) btn.addEventListener('click', attemptUnlock);
  if (inp) {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptUnlock();
      // Hide error AND hint while user is typing
      hide($('lock-error'));
      hide($('lock-hint-box'));
    });
    setTimeout(() => inp.focus(), 400);
  }
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      const isPass = inp.type === 'password';
      inp.type = isPass ? 'text' : 'password';
      if (eyeO) eyeO.classList.toggle('hidden', !isPass);
      if (eyeC) eyeC.classList.toggle('hidden', isPass);
    });
  }
}

// -- State ---------------------------------------------
const State = {
  orgs: [], contacts: [], emergency: [], banners: [],
  settings: null,
  currentPage: 'home', currentOrg: null, currentContact: null,
  contactFilters: { org:'', dept:'', desig:'', search:'' },
  syncing: false,
};


// -- DOM Helpers --------------------------------------------------
const $  = id => document.getElementById(id);
const show = el => { if (el) el.classList.remove('hidden'); };
const hide = el => { if (el) el.classList.add('hidden');    };

// -- Bangla → English digit converter -----------------------------
// Converts Bengali digits (০১২৩৪৫৬৭৮৯) to English (0123456789)
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
function toEngDigits(s) {
  if (!s) return '';
  return String(s).replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
}

// Smart phone normalizer -- handles all formats automatically:
//   +8801711000001  → +8801711000001  (correct, keep as-is)
//   8801711000001   → +8801711000001  (880 prefix → auto-add +)
//   01711000001     → +8801711000001  (BD mobile 11 digits → +880)
//   880-2-9669551   → +88029669551    (landline with dashes → +880)
//   -8788673        → ''              (Sheets formula artifact, need TEXT format)
//   ০১৭১১০০০০০১    → +8801711000001  (Bangla → English → +880)
function normPhone(raw) {
  if (!raw) return '';
  // Step 1: convert Bangla digits to English
  let s = toEngDigits(String(raw).trim());
  // Step 2: fix Google Sheets formula artifact (negative from math e.g. +880-2-X → -result)
  if (s.startsWith('-') && !s.includes('+')) {
    s = s.substring(1);
  }
  // Step 3: digits only
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  // Step 4: smart BD prefix detection
  if (digits.startsWith('880'))                        return '+' + digits;  // 8801711... → +8801711...
  if (digits.startsWith('01') && digits.length === 11) return '+880' + digits; // 01711000001 → +88001711000001
  if (digits.startsWith('1')  && digits.length === 10) return '+880' + digits; // 1711000001 → +8801711000001
  if (String(raw).trim().startsWith('+'))              return '+' + digits;   // had + originally
  // NOTE: short numbers (< 10 digits) like "8788673" are likely Sheets formula results
  // from +880-2-XXXXXXX being evaluated as arithmetic. These cannot be reliably
  // reconstructed → return digits as-is (caller must validate length)
  return digits;
}

// Returns true if this is a valid dialable phone number (≥10 digits)
function isValidPhone(normalized) {
  if (!normalized) return false;
  return normalized.replace(/\D/g,'').length >= 10;
}

// Show phone for display (fixes Sheets formula artifacts visually)
function displayPhone(raw) {
  if (!raw) return '';
  const s = toEngDigits(String(raw).trim());
  // Detect Sheets formula artifact (short negative number)
  if (s.startsWith('-') && !s.includes('+')) {
    const d = s.substring(1).replace(/\D/g,'');
    // If too short to be a real BD number, mark as needing fix
    if (d.length < 10) return raw; // show original (will look weird, prompts user to fix)
    return '+' + d;
  }
  return s;
}


// -- Colors / Avatars ---------------------------------------------
const ORG_COLORS = ['#4F8EF7','#7C3AED','#059669','#DC2626','#D97706','#0891B2','#0F766E','#BE185D','#4338CA','#B45309','#7C3AED','#06B6D4','#16A34A','#2563EB','#EA580C'];

function getOrgColor(org) {
  if (org && org.color) return org.color;
  const idx = State.orgs.findIndex(o => o.org_id === (org && org.org_id));
  return ORG_COLORS[Math.max(0, idx) % ORG_COLORS.length];
}
function getInitials(name) { return (name || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

// -- Compact MD5 (for Gravatar) ------------------------------------
function md5(str) {
  function rh(n){var j,s='';for(j=0;j<=3;j++)s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
  function ad(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}
  function rl(n,c){return(n<<c)|(n>>>(32-c));}
  function cm(q,a,b,x,s,t){return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
  function ff(a,b,c,d,x,s,t){return cm((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cm((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cm(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cm(c^(b|~d),a,b,x,s,t);}
  function sb(x){var i,nb=((x.length+8)>>6)+1,bl=new Array(nb*16);for(i=0;i<nb*16;i++)bl[i]=0;for(i=0;i<x.length;i++)bl[i>>2]|=x.charCodeAt(i)<<((i%4)*8);bl[i>>2]|=0x80<<((i%4)*8);bl[nb*16-2]=x.length*8;return bl;}
  var hc='0123456789abcdef',i,x=sb(unescape(encodeURIComponent(str)));
  var a=1732584193,b=-271733879,c=-1732584194,d=271733878;
  for(i=0;i<x.length;i+=16){
    var oa=a,ob=b,oc=c,od=d;
    a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
    a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
    a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
    a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
    a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
    a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
    a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
    a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
    a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
    a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
    a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
    a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
    a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
    a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
    a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
    a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
    a=ad(a,oa);b=ad(b,ob);c=ad(c,oc);d=ad(d,od);
  }
  return rh(a)+rh(b)+rh(c)+rh(d);
}


// -- Domain extractor (for Clearbit) ------------------------------
function extractDomain(url) {
  if (!url) return null;
  try {
    const u = url.startsWith('http') ? url : 'https://' + url;
    return new URL(u).hostname.replace(/^www\./, '');
  } catch { return null; }
}

// -- Staff Avatar -- Priority: Sheet → Gravatar → ui-avatars -------
function getUiAvatarUrl(contact) {
  const palettes = ['4F8EF7','7C3AED','059669','DC2626','D97706','0891B2','BE185D','4338CA'];
  const c = palettes[(contact.contact_id||'C0').charCodeAt(1) % palettes.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name||'?')}&background=${c}&color=fff&size=200&bold=true&format=svg`;
}
function getAvatarUrl(contact) {
  // Priority 1: Sheet photo_url
  if (contact.photo_url && contact.photo_url.startsWith('http')) return contact.photo_url;
  // Priority 2: Gravatar from email (returns 404 if not found → onerror handles it)
  if (contact.email && contact.email.includes('@')) {
    const hash = md5(contact.email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;
  }
  // Priority 3: ui-avatars (initials, always works)
  return getUiAvatarUrl(contact);
}

// -- Org Logo Markup -- Priority: Sheet → Clearbit → initials ------
function makeOrgLogoEl(org, size='md') {
  const color    = getOrgColor(org);
  const initials = getInitials(org.org_name);
  const fallback = `<div class="org-logo-initial org-logo-${size}" style="background:${color};display:none">${initials}</div>`;
  const fallbackOnly = `<div class="org-logo-initial org-logo-${size}" style="background:${color}">${initials}</div>`;
  const onerr = `this.style.display='none';this.nextSibling.style.display='flex'`;

  // Priority 1: Sheet logo_url
  if (org.logo_url && org.logo_url.startsWith('http')) {
    return `<img src="${org.logo_url}" alt="${org.org_name}" class="org-logo-img org-logo-${size}" onerror="${onerr}">${fallback}`;
  }
  // Priority 2: Clearbit logo from org website
  const domain = extractDomain(org.website);
  if (domain) {
    return `<img src="https://logo.clearbit.com/${domain}" alt="${org.org_name}" class="org-logo-img org-logo-${size}" onerror="${onerr}">${fallback}`;
  }
  // Priority 3: Color initials avatar
  return fallbackOnly;
}



// -- Org Lookup ---------------------------------------------------
function getOrgById(orgId) {
  return State.orgs.find(o => o.org_id === orgId) || null;
}

// -- Extension Call Link ------------------------------------------
// Builds: tel:+88029669974,,101  (main number pause extension)
// Requires org phone to be ≥10 digits (valid BD number)
function makeExtCallLink(contact) {
  const extRaw = contact.ext ? String(contact.ext).trim() : '';
  if (!extRaw) return null;
  const cleanExt = toEngDigits(extRaw).replace(/\D/g, '');
  if (!cleanExt) return null;

  const org = getOrgById(contact.org_id);
  if (org && org.phone) {
    const cleanMain = normPhone(org.phone);
    // Only use if it's a valid BD number (≥10 digits)
    // Short numbers = Sheets formula artifact from +880-X-XXXXXXX arithmetic
    if (isValidPhone(cleanMain)) {
      return `tel:${cleanMain},,${cleanExt}`;
    }
  }
  // Fallback: dial extension only (org phone not set or invalid in sheet)
  return `tel:${cleanExt}`;
}

// Returns true if this ext call has a valid org main number
function hasValidOrgPhone(contact) {
  const org = getOrgById(contact.org_id);
  if (!org || !org.phone) return false;
  return isValidPhone(normPhone(org.phone));
}

// Human-readable ext label for display
function extDisplayLabel(contact) {
  const org = getOrgById(contact.org_id);
  const ext = toEngDigits(contact.ext || '').replace(/\D/g,'');
  if (org && org.phone && isValidPhone(normPhone(org.phone))) {
    return `${displayPhone(org.phone)} → Ext. ${ext}`;
  }
  // Org phone missing or invalid → tell user to fix
  return `Ext. ${ext} (Organizations sheet এ phone যোগ করুন)`;
}

// -- Google Sheets URLs ------------------------------------------
function sheetCSV(name) {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}&_=${Date.now()}`;
}
// GViz JSON -- used for Settings (guarantees correct Unicode/Bengali)
function sheetJSON(name) {
  return `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(name)}&_=${Date.now()}`;
}
// Parse GViz JSON response string into [{key, value}] rows
function parseGvizSettings(text) {
  try {
    const json = JSON.parse(text.replace(/^[^{]+/, '').replace(/\)\s*;?\s*$/, ''));
    const rows = json.table ? (json.table.rows || []) : [];
    const obj  = {};
    rows.forEach(row => {
      if (!row.c) return;
      const k = row.c[0] && row.c[0].v != null ? String(row.c[0].v).trim() : '';
      const v = row.c[1] && row.c[1].v != null ? String(row.c[1].v).trim() : '';
      if (k) obj[k.toLowerCase()] = v;
    });
    return obj;
  } catch { return {}; }
}

// -- Fetch All Data (incl. Settings) --------------------------------
async function fetchSheetData() {
  if (CONFIG.USE_SAMPLE_DATA || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE') {
    return { orgs:SAMPLE_ORGS, contacts:SAMPLE_CONTACTS, emergency:SAMPLE_EMERGENCY, banners:[], settings:SAMPLE_SETTINGS };
  }
  const noStore = { cache: 'no-store' };

  async function fetchCSV(url) {
    const res = await fetch(url, noStore);
    const buf = await res.arrayBuffer();
    return new TextDecoder('utf-8').decode(buf);
  }

  const [orgT, conT, emT, banT] = await Promise.all([
    fetchCSV(sheetCSV(CONFIG.ORG_SHEET)),
    fetchCSV(sheetCSV(CONFIG.CONTACTS_SHEET)),
    fetchCSV(sheetCSV(CONFIG.EMERGENCY_SHEET)),
    fetchCSV(sheetCSV(CONFIG.BANNER_SHEET)),
  ]);

  // Settings: GViz JSON for guaranteed Unicode/Bengali
  const setRes  = await fetch(sheetJSON(CONFIG.SETTINGS_SHEET), noStore);
  const settingsObj = parseGvizSettings(await setRes.text());

  const banners = parseCSVRaw(banT).filter(b => {
    if (!b.image_url || !b.image_url.trim().startsWith('http')) return false;
    const active = (b.is_active || '').trim().toUpperCase();
    return active === 'TRUE' || active === '';
  });

  return {
    orgs:      parseCSV(orgT).filter(r => r.org_id && r.org_id.trim() && r.org_name && r.org_name.trim()),
    contacts:  parseCSV(conT).filter(r => r.name && r.name.trim()),
    emergency: parseCSV(emT).filter(r => r.name && r.name.trim() && (r.is_active||'').toUpperCase() !== 'FALSE'),
    banners,
    settings:  settingsObj,
  };
}


// -- Settings-only fetch (lightweight, used for auth before main load) --
// Uses GViz JSON (not CSV) -- guarantees correct Bengali/Unicode text
async function fetchSettingsOnly() {
  if (CONFIG.USE_SAMPLE_DATA || CONFIG.SHEET_ID === 'YOUR_SHEET_ID_HERE') {
    return SAMPLE_SETTINGS;
  }
  try {
    const res = await fetch(sheetJSON(CONFIG.SETTINGS_SHEET), { cache: 'no-store' });
    const obj = parseGvizSettings(await res.text());
    return Object.keys(obj).length ? obj : null;
  } catch { return null; }
}


// -- Storage -------------------------------------------------------
function saveData(d) {
  try {
    localStorage.setItem(CONFIG.STORAGE.ORGS,      JSON.stringify(d.orgs));
    localStorage.setItem(CONFIG.STORAGE.CONTACTS,  JSON.stringify(d.contacts));
    localStorage.setItem(CONFIG.STORAGE.EMERGENCY, JSON.stringify(d.emergency));
    localStorage.setItem(CONFIG.STORAGE.BANNER,    JSON.stringify(d.banners || []));
    // Save settings (password + hint) if present
    if (d.settings && Object.keys(d.settings).length) {
      localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(d.settings));
    }
    localStorage.setItem(CONFIG.STORAGE.LAST_SYNC, Date.now().toString());
  } catch(e) { console.warn('Storage:', e); }
}
function loadData() {
  try {
    const orgs      = JSON.parse(localStorage.getItem(CONFIG.STORAGE.ORGS)      || 'null');
    const contacts  = JSON.parse(localStorage.getItem(CONFIG.STORAGE.CONTACTS)  || 'null');
    const emergency = JSON.parse(localStorage.getItem(CONFIG.STORAGE.EMERGENCY) || 'null');
    const banners   = JSON.parse(localStorage.getItem(CONFIG.STORAGE.BANNER)    || 'null');
    const settings  = JSON.parse(localStorage.getItem(CONFIG.STORAGE.SETTINGS)  || 'null');
    return orgs && contacts ? { orgs, contacts, emergency:emergency||[], banners:Array.isArray(banners)?banners:[], settings:settings||SAMPLE_SETTINGS } : null;
  } catch { return null; }
}
function loadCachedSettings() {
  try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE.SETTINGS) || 'null'); }
  catch { return null; }
}
function getLastSync() { const t = localStorage.getItem(CONFIG.STORAGE.LAST_SYNC); return t ? parseInt(t) : null; }
function fmtSync(ts) {
  if (!ts) return 'Never synced';
  const m = Math.floor((Date.now()-ts)/60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

// -- Toast ---------------------------------------------------------
let _toastTimer;
function showToast(msg, ms=3000) {
  const el = $('toast');
  $('toast-message').textContent = msg;
  el.classList.remove('hidden');
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, ms);
}

// -- Sync Status Indicator -----------------------------------------
function setSyncStatus(s) {
  const dot  = document.querySelector('.sync-dot');
  const text = $('sync-text');
  if (!dot || !text) return;
  dot.className = `sync-dot ${s}`;
  const msgs = { syncing:'Syncing...', online:`Updated ${fmtSync(getLastSync())}`, offline:'Offline -- Cached data', error:'Sync Failed', sample:'Sample data -- Connect your Sheet' };
  text.textContent = msgs[s] || '';
}

// -- Drawer Version Updater ----------------------------------------
function updateDrawerVersion(settings) {
  const el = $('drawer-app-version');
  if (!el) return;
  const v = (settings && settings.app_version) || CONFIG.APP_VERSION || '2.0.0';
  el.textContent = 'Version ' + v;
}

// -- Sync Data -----------------------------------------------------
async function syncData(silent=false) {
  if (State.syncing) return;
  State.syncing = true;
  const btn = $('sync-btn');
  if (btn) btn.classList.add('spinning');
  setSyncStatus('syncing');
  try {
    const data = await fetchSheetData();
    State.orgs      = data.orgs;
    State.contacts  = data.contacts;
    State.emergency = data.emergency || [];
    State.banners   = data.banners  || [];
    // Update settings (password/hint) from sheet
    if (data.settings && Object.keys(data.settings).length) {
      State.settings = data.settings;
      updateDrawerVersion(data.settings);
    }
    saveData(data);
    updateStats();
    renderBannerAd(State.banners);
    renderContactsPage();
    renderEmergencyPage();
    renderOrgGrid();
    setSyncStatus(CONFIG.USE_SAMPLE_DATA ? 'sample' : 'online');
    if (!silent) showToast('\u2705 Data updated!');
  } catch(err) {
    console.warn('Sync failed -- loading from cache:', err.message || err);
    const cached = loadData();
    if (cached) {
      State.orgs      = cached.orgs      || [];
      State.contacts  = cached.contacts  || [];
      State.emergency = cached.emergency || [];
      State.banners   = cached.banners   || [];
      if (cached.settings) { State.settings = cached.settings; updateDrawerVersion(cached.settings); }
      updateStats();
      renderBannerAd(State.banners);
      renderContactsPage();
      renderEmergencyPage();
      renderOrgGrid();
    }
    setSyncStatus(navigator.onLine ? 'error' : 'offline');
    if (!silent) showToast(navigator.onLine ? '\u26A0\uFE0F Sync failed' : '\uD83D\uDCE1 Offline -- Using cached data');
  } finally {
    State.syncing = false;
    if (btn) btn.classList.remove('spinning');
  }
}

// -- Banner Ad Slideshow ---------------------------------
let _bannerTimer = null;
let _bannerIdx   = 0;
let _bannerList  = [];

function convertToDirectImageUrl(url) {
  if (!url) return url;
  const m1 = url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)/);
  if (m1) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;
  const m2 = url.match(/drive\.google\.com\/thumbnail\?.*id=([^&]+)/);
  if (m2) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;
  const m3 = url.match(/drive\.google\.com\/open\?.*id=([^&]+)/);
  if (m3) return `https://drive.google.com/uc?export=view&id=${m3[1]}`;
  return url;
}

function proxyUrl(url) {
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=800&output=webp&n=-1`;
}

function renderBannerAd(banners) {
  const bannerEl = $('banner-ad');
  const pagesEl  = $('pages-container');
  if (!bannerEl) return;
  if (_bannerTimer) { clearTimeout(_bannerTimer); _bannerTimer = null; }
  const raw  = Array.isArray(banners) ? banners : (banners ? [banners] : []);
  const list = raw.filter(b => {
    if (!b || !b.image_url || !b.image_url.trim().startsWith('http')) return false;
    const active = (b.is_active || '').trim().toUpperCase();
    return active === 'TRUE' || active === '';
  });
  _bannerList = list;
  _bannerIdx  = 0;
  if (!list.length) { hide(bannerEl); pagesEl.classList.remove('has-banner'); return; }
  bannerEl.innerHTML = `
    <div class="banner-slides">
      ${list.map((b,i) => {
        const direct = convertToDirectImageUrl(b.image_url.trim());
        const proxy  = proxyUrl(direct);
        return `<a href="${(b.click_url||'#').trim()}" target="_blank" rel="noopener"
           class="banner-slide${i===0?' active':''}" data-idx="${i}">
          <img src="${direct}" alt="Banner ${i+1}"
               onerror="if(!this._tried){this._tried=true;this.src='${proxy}';}"
               style="width:100%;height:100%;object-fit:cover;display:block">
        </a>`;
      }).join('')}
    </div>
    <button class="banner-close" id="banner-close">&#x2715;</button>
    ${list.length > 1 ? `<div class="banner-dots">${list.map((_,i)=>`<span class="banner-dot${i===0?' active':''}" data-idx="${i}"></span>`).join('')}</div>` : ''}
  `;
  show(bannerEl);
  pagesEl.classList.add('has-banner');
  const closeBtn = $('banner-close');
  if (closeBtn) closeBtn.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    if (_bannerTimer) clearTimeout(_bannerTimer);
    hide(bannerEl); pagesEl.classList.remove('has-banner');
  };
  bannerEl.querySelectorAll('.banner-dot').forEach(dot => {
    dot.onclick = () => _showSlide(parseInt(dot.dataset.idx));
  });
  if (list.length > 1) _scheduleBannerNext();
}

function _showSlide(idx) {
  if (_bannerTimer) { clearTimeout(_bannerTimer); _bannerTimer = null; }
  _bannerIdx = ((idx % _bannerList.length) + _bannerList.length) % _bannerList.length;
  const bannerEl = $('banner-ad');
  if (!bannerEl) return;
  bannerEl.querySelectorAll('.banner-slide').forEach((s,i) => s.classList.toggle('active', i===_bannerIdx));
  bannerEl.querySelectorAll('.banner-dot').forEach((d,i)   => d.classList.toggle('active', i===_bannerIdx));
  if (_bannerList.length > 1) _scheduleBannerNext();
}

function _scheduleBannerNext() {
  const cur = _bannerList[_bannerIdx];
  const dur = Math.max(1, parseInt(cur.duration_sec) || 4) * 1000;
  _bannerTimer = setTimeout(() => _showSlide(_bannerIdx + 1), dur);
}
// -- Navigation ----------------------------------------------------
function navigate(page, params={}) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = $(`page-${page}`);
  if (!pageEl) return;
  pageEl.classList.add('active');
  State.currentPage = page;
  window.scrollTo(0,0);

  const backBtn  = $('back-btn');
  const title    = $('page-title');
  const subtitle = $('page-subtitle');

  // Nav highlight
  ['nav-home','nav-contacts','nav-emergency'].forEach(id => {
    const el = $(id); if(el) el.classList.remove('active');
  });
  if (page==='home')      { const n=$('nav-home');      if(n) n.classList.add('active'); }
  if (page==='contacts')  { const n=$('nav-contacts');  if(n) n.classList.add('active'); }
  if (page==='emergency') { const n=$('nav-emergency'); if(n) n.classList.add('active'); }

  // Per-page setup
  if (page==='home') {
    hide(backBtn); title.textContent='BADAS Directory'; subtitle.textContent='Contact Directory';
    renderHomePage();
  } else if (page==='org') {
    show(backBtn); State.currentOrg = params.orgId;
    renderOrgPage(params.orgId);
  } else if (page==='contacts') {
    if (params.orgId) { show(backBtn); State.contactFilters={...State.contactFilters, org:params.orgId}; }
    else              { hide(backBtn); State.contactFilters={org:'',dept:'',desig:'',search:''}; }
    title.textContent='Contacts';
    subtitle.textContent = params.orgId ? (getOrgById(params.orgId)?.org_name||'') : 'All Contacts';
    renderContactsPage();
  } else if (page==='emergency') {
    hide(backBtn); title.textContent='Emergency'; subtitle.textContent='Quick Contacts';
    renderEmergencyPage();
  } else if (page==='contact-detail') {
    show(backBtn); State.currentContact=params.contactId;
    renderContactDetail(params.contactId);
  }
}

function goBack() {
  if (State.currentPage==='org') navigate('home');
  else if (State.currentPage==='contacts') {
    if (State.contactFilters.org) navigate('org',{orgId:State.contactFilters.org});
    else navigate('home');
  } else if (State.currentPage==='contact-detail') navigate('contacts');
  else navigate('home');
}

// -- Data Helpers --------------------------------------------------
function getOrgById(id) { return State.orgs.find(o=>o.org_id===id); }
function getContactById(id) { return State.contacts.find(c=>c.contact_id===id); }
function getUnique(field) { return [...new Set(State.contacts.map(c=>c[field]).filter(Boolean))].sort(); }

// -- Stats ---------------------------------------------------------
function updateStats() {
  const s = $('stat-orgs');     if(s) s.textContent = State.orgs.length;
  const c = $('stat-contacts'); if(c) c.textContent = State.contacts.length;
  const d = $('stat-depts');    if(d) d.textContent = getUnique('department').length;
}

// ==================================================================
// HOME PAGE
// ==================================================================
function renderHomePage() {
  updateStats();
  renderOrgGrid(State.orgs);
  const inp = $('org-search');
  if (inp) {
    inp.value = '';
    inp.oninput = e => {
      const q = e.target.value.trim().toLowerCase();
      q ? show($('org-search-clear')) : hide($('org-search-clear'));
      renderOrgGrid(State.orgs.filter(o =>
        o.org_name.toLowerCase().includes(q) || o.org_full_name.toLowerCase().includes(q)
      ));
    };
  }
  const clr = $('org-search-clear');
  if (clr) clr.onclick = () => { inp.value=''; hide(clr); renderOrgGrid(State.orgs); };
}

function renderOrgGrid(orgs) {
  orgs = orgs || State.orgs || [];
  const grid  = $('org-grid');
  const count = $('org-count');
  const empty = $('org-empty');
  if (!grid) return;
  if (count) count.textContent = orgs.length;
  if (!orgs.length) { grid.innerHTML=''; show(empty); return; }
  hide(empty);
  grid.innerHTML = orgs.map(org => {
    const color = getOrgColor(org);
    const cnt   = State.contacts.filter(c=>c.org_id===org.org_id).length;
    return `<div class="org-card" onclick="navigate('org',{orgId:'${org.org_id}'})" role="button" tabindex="0" aria-label="${org.org_name}">
      <div class="org-card-logo" style="background:linear-gradient(135deg,${color}30,${color}12)">
        ${makeOrgLogoEl(org,'md')}
      </div>
      <div class="org-card-info">
        <div class="org-card-name">${org.org_name}</div>
        <div class="org-card-count">${cnt} contact${cnt!==1?'s':''}</div>
      </div>
      <div class="org-card-arrow" style="color:${color}88">›</div>
    </div>`;
  }).join('');
}

// ==================================================================
// ORG PROFILE PAGE
// ==================================================================
function renderOrgPage(orgId) {
  const org = getOrgById(orgId);
  if (!org) { navigate('home'); return; }
  const color = getOrgColor(org);
  $('page-title').textContent   = org.org_name;
  $('page-subtitle').textContent = 'Organization Profile';
  $('org-hero-bg').style.background = `linear-gradient(160deg,${color}55 0%,#060B1F 70%)`;
  $('org-logo-large').innerHTML = makeOrgLogoEl(org,'lg');
  $('org-hero-name').textContent = org.org_name;
  $('org-hero-full').textContent = org.org_full_name;

  const items = [];
  if (org.address) items.push({icon:'📍',label:'Address',value:org.address});
  if (org.phone)   items.push({icon:'📞',label:'Phone',  value:org.phone,  href:`tel:${normPhone(org.phone)}`});
  if (org.email)   items.push({icon:'✉️',label:'Email',  value:org.email,  href:`mailto:${org.email}`});
  if (org.website) items.push({icon:'\uD83C\uDF10',label:'Website',value:org.website,href:org.website.startsWith('http')?org.website:'https://'+org.website});
  if (org.about)   items.push({icon:'ℹ️',label:'About',  value:org.about});

  $('org-info-section').innerHTML = `<div class="section"><div class="info-cards">${
    items.map(it=>`<div class="info-card ${it.href?'clickable':''}" ${it.href?`onclick="window.open('${it.href}','_self')"`:''}}>
      <div class="info-card-icon">${it.icon}</div>
      <div class="info-card-body"><div class="info-card-label">${it.label}</div><div class="info-card-value">${it.value}</div></div>
      ${it.href?'<div class="info-card-ext">↗</div>':''}
    </div>`).join('')}
  </div></div>`;

  const btn = $('view-contacts-btn');
  const cnt = State.contacts.filter(c=>c.org_id===orgId).length;
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>View All Contacts (${cnt})`;
  btn.onclick = () => navigate('contacts',{orgId});
}

// ==================================================================
// CONTACTS PAGE
// ==================================================================
function renderContactsPage() {
  populateFilters();
  applyFilters();
  const inp = $('contact-search');
  if (inp) {
    inp.value = State.contactFilters.search || '';
    inp.oninput = e => {
      State.contactFilters.search = e.target.value.trim();
      State.contactFilters.search ? show($('contact-search-clear')) : hide($('contact-search-clear'));
      applyFilters();
    };
  }
  $('contact-search-clear').onclick = () => { inp.value=''; State.contactFilters.search=''; hide($('contact-search-clear')); applyFilters(); };

  const fOrg   = $('filter-org');   if(fOrg)  { fOrg.value=State.contactFilters.org;   fOrg.onchange   = e=>{State.contactFilters.org=e.target.value;   applyFilters();} }
  const fDept  = $('filter-dept');  if(fDept) { fDept.value=State.contactFilters.dept;  fDept.onchange  = e=>{State.contactFilters.dept=e.target.value;  applyFilters();} }
  const fDesig = $('filter-desig'); if(fDesig){ fDesig.value=State.contactFilters.desig;fDesig.onchange = e=>{State.contactFilters.desig=e.target.value; applyFilters();} }

  ['clear-filters','clear-filters-empty'].forEach(id=>{
    const b=$(id); if(b) b.onclick=()=>{
      State.contactFilters={org:'',dept:'',desig:'',search:''};
      if(inp)   inp.value=''; hide($('contact-search-clear'));
      if(fOrg)  fOrg.value=''; if(fDept) fDept.value=''; if(fDesig) fDesig.value='';
      applyFilters();
    };
  });
}

function populateFilters() {
  const fOrg = $('filter-org');
  if (fOrg) fOrg.innerHTML = '<option value="">All Organizations</option>' +
    State.orgs.map(o=>`<option value="${o.org_id}">${o.org_name}</option>`).join('');
  const fDept = $('filter-dept');
  if (fDept) fDept.innerHTML = '<option value="">All Departments</option>' +
    getUnique('department').map(d=>`<option value="${d}">${d}</option>`).join('');
  const fDesig = $('filter-desig');
  if (fDesig) fDesig.innerHTML = '<option value="">All Designations</option>' +
    getUnique('designation').map(d=>`<option value="${d}">${d}</option>`).join('');
}

function applyFilters() {
  const {org,dept,desig,search} = State.contactFilters;
  const filtered = State.contacts.filter(c => {
    if (org   && c.org_id      !== org)   return false;
    if (dept  && c.department  !== dept)  return false;
    if (desig && c.designation !== desig) return false;
    if (search) {
      const q = search.toLowerCase();
      const o = getOrgById(c.org_id);
      return c.name.toLowerCase().includes(q) ||
        (c.designation||'').toLowerCase().includes(q) ||
        (c.department||'').toLowerCase().includes(q) ||
        (o?.org_name||'').toLowerCase().includes(q);
    }
    return true;
  });
  renderContactList(filtered);
  const hasF = org||dept||desig||search;
  hasF ? show($('clear-filters')) : hide($('clear-filters'));

  // Show org-tinted banner when filtering by a single org
  const bannerEl = $('contacts-org-banner');
  if (bannerEl) {
    if (org) {
      const orgData = getOrgById(org);
      if (orgData) {
        const color = getOrgColor(orgData);
        const initials = getInitials(orgData.org_name);
        bannerEl.style.background = `linear-gradient(135deg, ${color}22, ${color}11)`;
        bannerEl.style.borderBottom = `1px solid ${color}33`;
        bannerEl.innerHTML = `
          <div class="contacts-org-banner-icon" style="background:${color}">
            ${orgData.logo_url && orgData.logo_url.startsWith('http')
              ? `<img src="${orgData.logo_url}" style="width:100%;height:100%;object-fit:contain;border-radius:12px" onerror="this.style.display='none'">`
              : initials}
          </div>
          <div>
            <div class="contacts-org-banner-name" style="color:${color}">${orgData.org_full_name||orgData.org_name}</div>
            <div class="contacts-org-banner-count">${filtered.length} জন পাওয়া গেছে</div>
          </div>`;
        show(bannerEl);
      }
    } else {
      hide(bannerEl); bannerEl.innerHTML = '';
    }
  }
}



function renderContactList(contacts) {
  const list  = $('contacts-list');
  const empty = $('contact-empty');
  const ctxt  = $('contact-count-text');
  if (!list) return;
  if (ctxt) ctxt.textContent = `${contacts.length} contact${contacts.length!==1?'s':''} found`;
  if (!contacts.length) { list.innerHTML=''; show(empty); return; }
  hide(empty);
  list.innerHTML = contacts.map(c => {
    const org    = getOrgById(c.org_id);
    const oColor = org ? getOrgColor(org) : '#4F8EF7';
    const hasWA  = (c.has_whatsapp||'').trim().toUpperCase() === 'TRUE';
    const extLink = makeExtCallLink(c);
    const extNum  = c.ext ? toEngDigits(c.ext).replace(/\D/g,'') : '';
    // Build the phone/ext info line shown in the card
    const phoneDisplay = c.phone ? displayPhone(c.phone) : '';
    const phoneInfoParts = [];
    if (phoneDisplay) phoneInfoParts.push(`<span class="contact-card-phone">${phoneDisplay}</span>`);
    if (extNum)       phoneInfoParts.push(`<span class="contact-card-ext-badge">Ext. ${extNum}</span>`);
    return `<div class="contact-card" onclick="navigate('contact-detail',{contactId:'${c.contact_id}'})" role="button" tabindex="0">
      <div class="contact-card-photo">
        <img src="${getAvatarUrl(c)}" alt="${c.name}" loading="lazy" class="contact-avatar" onerror="this.onerror=null;this.src='${getUiAvatarUrl(c)}'">

        ${hasWA?'<div class="wa-badge" title="WhatsApp">💬</div>':''}
      </div>
      <div class="contact-card-body">
        <div class="contact-card-name">${c.name}</div>
        <div class="contact-card-desig">${c.designation||''}</div>
        <div class="contact-card-org" style="color:${oColor}">${org?.org_name||c.org_id}</div>
        <div class="contact-card-meta">
          ${c.department?`<span class="contact-card-dept">${c.department}</span>`:''}
          ${phoneInfoParts.join('')}
        </div>
      </div>
      <div class="contact-card-actions">
        ${c.phone?`<a href="tel:${normPhone(c.phone)}" class="action-btn call-btn" onclick="event.stopPropagation()" title="Call: ${displayPhone(c.phone)}">${ICON_CALL}</a>`:''}
        ${extLink?`<a href="${extLink}" class="action-btn ext-btn" onclick="event.stopPropagation()" title="Ext. ${extNum}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01"/></svg></a>`:''}
        ${hasWA&&c.phone?`<a href="https://wa.me/${normPhone(c.phone).replace(/\D/g,'')}" class="action-btn wa-btn" onclick="event.stopPropagation()" target="_blank" rel="noopener" title="WhatsApp">${ICON_WA}</a>`:''}
        ${c.email?`<a href="mailto:${c.email}" class="action-btn email-btn" onclick="event.stopPropagation()" title="Email">${ICON_EMAIL}</a>`:''}
      </div>
    </div>`;
  }).join('');
}

// ==================================================================
// EMERGENCY PAGE
// ==================================================================
function renderEmergencyPage() {
  // National helplines
  const natGrid = $('national-emergency-grid');
  if (natGrid) {
    natGrid.innerHTML = NATIONAL_EMERGENCY.map(n => `
      <a href="tel:${normPhone(n.number)}" class="nat-card" style="--nc:${n.color}">
        <div class="nat-icon">${n.icon}</div>
        <div class="nat-label">${n.label}</div>
        <div class="nat-number">${n.number}</div>
        <div class="nat-call-badge">TAP TO CALL</div>
      </a>`).join('');
  }

  // BADAS emergency contacts
  const list  = $('emergency-contacts-list');
  const empty = $('emergency-empty');
  const count = $('emergency-count');

  const items = State.emergency.filter(e => (e.is_active||'TRUE').toUpperCase() !== 'FALSE');
  if (count) count.textContent = items.length;

  if (!items.length) { if(list) list.innerHTML=''; show(empty); return; }
  hide(empty);

  if (list) list.innerHTML = items.map(e => {
    const org   = getOrgById(e.org_id);
    const color = org ? getOrgColor(org) : '#EF4444';
    const typeColors = { Hospital:'#EF4444', Ambulance:'#F97316', Admin:'#4F8EF7', Police:'#3B82F6', Fire:'#F97316' };
    const tc = typeColors[e.type] || '#EF4444';
    return `<div class="emergency-contact-card">
      <div class="emergency-contact-icon" style="background:${tc}22;color:${tc}">
        ${e.type==='Hospital'?'\uD83C\uDFE5':e.type==='Ambulance'?'\uD83D\uDE91':e.type==='Admin'?'\uD83C\uDFE2':e.type==='Police'?'\uD83D\uDE94':'\uD83D\uDCDE'}
      </div>
      <div class="emergency-contact-body">
        <div class="emergency-contact-name">${e.name}</div>
        <div class="emergency-contact-desig">${e.designation||''}</div>
        ${org?`<div class="emergency-contact-org" style="color:${color}">${org.org_name}</div>`:''}
        <div class="emergency-contact-type" style="background:${tc}22;color:${tc}">${e.type||'Emergency'}</div>
      </div>
      <a href="tel:${normPhone(e.phone)}" class="emergency-call-btn" title="Call ${e.name}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
        <span>${e.phone}</span>
      </a>
    </div>`;
  }).join('');
}

// ==================================================================
// CONTACT DETAIL PAGE
// ==================================================================
function renderContactDetail(contactId) {
  const c = getContactById(contactId);
  if (!c) { navigate('contacts'); return; }
  const org    = getOrgById(c.org_id);
  const oColor = org ? getOrgColor(org) : '#4F8EF7';
  const hasWA  = (c.has_whatsapp||'').trim().toUpperCase() === 'TRUE';
  const extLink = makeExtCallLink(c);

  $('page-title').textContent    = 'Contact';
  $('page-subtitle').textContent = c.designation;

  const photoEl = $('contact-photo-large');
  if (photoEl) { photoEl.innerHTML=`<img src="${getAvatarUrl(c)}" alt="${c.name}" class="contact-photo-xl" onerror="this.onerror=null;this.src='${getUiAvatarUrl(c)}'">`; photoEl.style.borderColor=oColor; }

  $('contact-hero-name').textContent        = c.name;
  $('contact-hero-designation').textContent = c.designation;
  const orgEl = $('contact-hero-org'); if(orgEl){ orgEl.textContent=org?.org_full_name||c.org_id; orgEl.style.color=oColor; }

  const items = [];
  if (org)          items.push({icon:'🏢',label:'Organization', value:org.org_name,  sub:org.org_full_name});
  if (c.department) items.push({icon:'📋',label:'Department',   value:c.department});
  if (c.designation)items.push({icon:'🏷️',label:'Designation',  value:c.designation});
  if (c.phone)      items.push({icon:'📞',label:'Phone',        value:displayPhone(c.phone),  href:`tel:${normPhone(c.phone)}`});
  // Extension: always show if ext exists
  if (c.ext) {
    items.push({
      icon: '🔢',
      label: 'Ext.',
      value: toEngDigits(c.ext).replace(/\D/g,''),
      sub: extDisplayLabel(c),
      href: extLink,
    });
  }
  if (c.email)      items.push({icon:'✉️',label:'Email',        value:c.email,  href:`mailto:${c.email}`});

  $('contact-detail-info').innerHTML = `<div class="section"><div class="info-cards">${
    items.map(it=>`<div class="info-card ${it.href?'clickable':''}" ${it.href?`onclick="window.open('${it.href}','_self')"`:''}}>
      <div class="info-card-icon">${it.icon}</div>
      <div class="info-card-body">
        <div class="info-card-label">${it.label}</div>
        <div class="info-card-value">${it.value}</div>
        ${it.sub?`<div class="info-card-sub">${it.sub}</div>`:''}
      </div>
      ${it.href?'<div class="info-card-ext">↗</div>':''}
    </div>`).join('')}
  </div></div>`;

  const btns = [];
  if (c.phone)        btns.push(`<a href="tel:${normPhone(c.phone)}" class="action-large call-large">${ICON_CALL}<span>Call Direct</span></a>`);
  if (extLink) {
    const extNum = toEngDigits(c.ext||'').replace(/\D/g,'');
    btns.push(`<a href="${extLink}" class="action-large ext-large"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M12 9h.01M15 9h.01M9 12h.01M12 12h.01M15 12h.01M9 15h.01M12 15h.01"/></svg><span>Call Ext. ${extNum}</span></a>`);
  }
  if (hasWA&&c.phone) btns.push(`<a href="https://wa.me/${normPhone(c.phone).replace(/\D/g,'')}" target="_blank" rel="noopener" class="action-large wa-large">${ICON_WA}<span>WhatsApp</span></a>`);
  if (c.email)        btns.push(`<a href="mailto:${c.email}" class="action-large email-large">${ICON_EMAIL}<span>Email</span></a>`);
  $('contact-actions').innerHTML = `<div class="section"><div class="action-row">${btns.join('')}</div></div>`;
}

// -- Icon SVGs (reusable) -----------------------------------------
const ICON_CALL  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>`;
const ICON_WA    = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
const ICON_EMAIL = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;

// -- Init ----------------------------------------------------------
// Hide the splash screen with a fade animation
function hideSplash() {
  const s = $('splash-screen');
  if (s && !s.classList.contains('hidden')) {
    s.classList.add('fade-out');
    setTimeout(() => s.classList.add('hidden'), 400);
  }
}

// -- Apply logo from Settings sheet ------------------------------
// Settings key: logo_url  (any public image URL)
function applyLogoFromSettings(settings) {
  if (!settings) return;
  const url = (settings.logo_url || '').trim();
  if (!url || !url.startsWith('http')) return;

  // Convert Drive share link to direct URL if needed
  const direct = convertToDirectImageUrl ? convertToDirectImageUrl(url) : url;

  // Splash screen logo
  const splashImg = document.querySelector('.splash-logo-img');
  if (splashImg) {
    splashImg.src = direct;
    splashImg.style.display = 'block';
    if (splashImg.nextElementSibling) splashImg.nextElementSibling.style.display = 'none';
  }

  // Header logo (replaces the blue "B" circle)
  const headerLogo = document.querySelector('.header-logo');
  if (headerLogo) {
    headerLogo.innerHTML = `<img src="${direct}" alt="Logo"
      style="width:100%;height:100%;object-fit:contain;border-radius:10px"
      onerror="this.parentNode.innerHTML='B'">`;
  }

  // Drawer logo
  const drawerLogo = document.querySelector('.drawer-logo');
  if (drawerLogo) {
    drawerLogo.innerHTML = `<img src="${direct}" alt="Logo"
      style="width:100%;height:100%;object-fit:contain;border-radius:12px"
      onerror="this.parentNode.innerHTML='B'">`;
  }
}

async function initApp() {
  const lockStatus = $('lock-fetch-status');
  if (lockStatus) { lockStatus.textContent = 'Checking...'; show(lockStatus); }

  let currentSettings = null;
  try {
    // 8-second timeout -- if Sheet unreachable, fall back to cache instantly
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000));
    const fresh = await Promise.race([fetchSettingsOnly(), timeout]);
    if (fresh) {
      currentSettings = fresh;
      State.settings  = fresh;
      localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(fresh));
      applyLogoFromSettings(fresh);
    } else {
      currentSettings = loadCachedSettings() || SAMPLE_SETTINGS;
      State.settings  = currentSettings;
      applyLogoFromSettings(currentSettings);
    }
  } catch {
    currentSettings = loadCachedSettings() || SAMPLE_SETTINGS;
    State.settings  = currentSettings;
    applyLogoFromSettings(currentSettings);
  }

  if (lockStatus) hide(lockStatus);

  const correctPw = (currentSettings && currentSettings.password)
    || CONFIG.PASSWORD
    || '';

  if (checkSession(correctPw)) {
    hide($('lock-screen'));
    await startApp();
    return;
  }

  // Session invalid / first launch -- hide splash, show lock screen
  hideSplash();
  const lockEl = $('lock-screen');
  if (lockEl) lockEl.classList.remove('hidden');
  setupLockListeners();
}


async function startApp() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  window.addEventListener('online',  () => { showToast('\uD83C\uDF10 Back online!'); syncData(true); });
  window.addEventListener('offline', () => { setSyncStatus('offline'); showToast('\uD83D\uDCE1 Offline mode'); });

  // -- Step 1: Load & render cached data IMMEDIATELY ----------------
  // This ensures data shows even if offline (before network attempt)
  const cached = loadData();
  if (cached) {
    State.orgs      = cached.orgs      || [];
    State.contacts  = cached.contacts  || [];
    State.emergency = cached.emergency || [];
    State.banners   = cached.banners   || [];
    if (cached.settings) { State.settings = cached.settings; updateDrawerVersion(cached.settings); }
    // Render ALL pages right now from cache
    updateStats();
    renderBannerAd(State.banners);
    renderContactsPage();
    renderEmergencyPage();
    renderOrgGrid();
    setSyncStatus('offline'); // will update to 'online' after sync
    $('splash-status').textContent = 'Loading from cache\u2026';
  } else {
    $('splash-status').textContent = 'Syncing\u2026';
  }

  // -- Step 2: Try network sync (updates cache if successful) -------
  await syncData(true);

  setTimeout(() => {
    const splash = $('splash-screen');
    const appEl  = $('app');
    if (splash) { splash.classList.add('fade-out'); setTimeout(()=>splash.classList.add('hidden'),400); }
    if (appEl)  { appEl.classList.remove('hidden'); requestAnimationFrame(()=>appEl.classList.add('visible')); }
    navigate('home');
    setupListeners();
  }, 600);

  setInterval(() => { if (navigator.onLine) syncData(true); }, CONFIG.SYNC_INTERVAL_MS);
}


function openDrawer() {
  const drawer  = $('drawer');
  const overlay = $('drawer-overlay');
  if (!drawer) return;
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    drawer.classList.add('open');
  });
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  const drawer  = $('drawer');
  const overlay = $('drawer-overlay');
  if (!drawer) return;
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  setTimeout(() => { overlay.classList.add('hidden'); }, 320);
  document.body.style.overflow = '';
}

function setupListeners() {
  $('back-btn').onclick    = goBack;
  $('sync-btn').onclick    = () => syncData(false);
  $('nav-home').onclick    = () => navigate('home');
  $('nav-contacts').onclick = () => { State.contactFilters={org:'',dept:'',desig:'',search:''}; navigate('contacts'); };
  $('nav-emergency').onclick = () => navigate('emergency');

  // Drawer
  const drawerBtn   = $('drawer-btn');
  const drawerClose = $('drawer-close');
  const overlay     = $('drawer-overlay');
  if (drawerBtn)   drawerBtn.onclick   = openDrawer;
  if (drawerClose) drawerClose.onclick = closeDrawer;
  if (overlay)     overlay.onclick     = closeDrawer;

  const bannerClose = $('banner-close');
  if (bannerClose) bannerClose.onclick = (e) => {
    e.preventDefault();
    hide($('banner-ad'));
    $('pages-container').classList.remove('has-banner');
  };
}

document.addEventListener('DOMContentLoaded', initApp);
