# BADAS Directory — Setup & Google Sheets Guide

## 📱 App Features
- ✅ Home: 15 Organization cards with logo/initials
- ✅ Contacts: Search by name, filter by Org / Department / Designation
- ✅ Emergency: National helplines + BADAS emergency contacts with 1-tap call
- ✅ Banner Ad: Small banner above nav bar (auto-hides if no ad is set)
- ✅ Offline mode: Works without internet after first load
- ✅ Auto-sync: Updates from Google Sheet every 30 minutes
- ✅ WhatsApp, Call, Email — tap to action

---

## 🔗 Step 1 — Create Your Google Sheet

Create a new Google Sheet with **4 tabs** (sheet names must match exactly):

### Tab 1: `Organizations`
| org_id | org_name | org_full_name | logo_url | address | phone | email | website | about | color |
|---|---|---|---|---|---|---|---|---|---|
| BADAS | BADAS | Bangladesh Diabetic Somity | https://... | Dhaka | +880... | info@badas.org.bd | www.badas.org.bd | Description here | #4F8EF7 |

> **color** column is optional. Use hex color codes like `#4F8EF7`.
> **logo_url**: upload logo to Google Drive → Share → "Anyone with link" → copy direct link

### Tab 2: `Contacts`
| contact_id | org_id | name | designation | department | phone | email | photo_url | has_whatsapp |
|---|---|---|---|---|---|---|---|---|
| C001 | BADAS | Dr. Example Name | Director | Administration | +8801711000001 | email@org.bd | https://... | TRUE |

> **has_whatsapp**: type `TRUE` or `FALSE` (capital letters)
> **photo_url**: upload photo to Google Drive → Share → "Anyone with link" → copy link

### Tab 3: `Emergency`
| contact_id | name | designation | org_id | phone | type | is_active |
|---|---|---|---|---|---|---|
| E001 | BIRDEM Emergency | Emergency Dept | BIRDEM | +880-2-9669974 | Hospital | TRUE |

> **type** options: `Hospital`, `Ambulance`, `Admin`, `Police`, `Fire`
> **is_active**: `TRUE` to show, `FALSE` to hide

### Tab 4: `BannerAd`
| image_url | click_url | is_active |
|---|---|---|
| https://... | https://badas.org.bd | TRUE |

> Leave **image_url** empty OR set **is_active** to `FALSE` to hide the banner completely.
> If hidden, NO empty space will appear above the navigation bar.

---

## 🔑 Step 2 — Make Sheet Public

1. Open your Google Sheet
2. Click **Share** (top right)
3. Under "General access" → change to **"Anyone with the link"** → set role to **"Viewer"**
4. Click **Done**

Then publish it:
1. Go to **File → Share → Publish to web**
2. Click **Publish** → **OK**

---

## 🆔 Step 3 — Get Your Sheet ID

Your Sheet URL looks like:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
```
The Sheet ID is the long code between `/d/` and `/edit`:
```
1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

---

## ⚙️ Step 4 — Connect Sheet to App

Open the file `js/config.js` in any text editor (Notepad is fine):

Find this line:
```javascript
SHEET_ID: 'YOUR_SHEET_ID_HERE',
```

Replace with your actual Sheet ID:
```javascript
SHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
```

Also change this line from `true` to `false`:
```javascript
USE_SAMPLE_DATA: false,
```

Save the file. The app will now read from your Google Sheet!

---

## 🌐 Step 5 — Host the App (Free)

### Option A: GitHub Pages (Recommended)
1. Create a free account at [github.com](https://github.com)
2. Create a new repository named `badas-directory`
3. Upload all app files
4. Go to **Settings → Pages → Source: main branch → Save**
5. Your app URL: `https://yourusername.github.io/badas-directory`

### Option B: Any Web Host
Upload all files to your web server's public folder.

---

## 📲 Installing as Mobile App

### Android (Chrome)
1. Open app URL in Chrome
2. Tap the **3-dot menu**
3. Tap **"Add to Home Screen"**
4. Tap **Add** → App installs!

### iPhone (Safari)
1. Open app URL in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **Add** → App installs!

---

## 🔄 Updating Data

Just update your Google Sheet — the app will **automatically sync** within 30 minutes when online.
Users can also manually sync by tapping the **refresh icon** in the top right corner.

---

## 📋 Google Drive Image Links

To use images from Google Drive:
1. Upload image to Google Drive
2. Right-click → **Share** → Set to "Anyone with the link"
3. Copy link: `https://drive.google.com/file/d/FILE_ID/view`
4. Convert to direct link: `https://drive.google.com/uc?export=view&id=FILE_ID`
5. Use this converted link in your Sheet

---

## 🆘 Need Help?

If the app shows "Sample data — Connect your Sheet", it means `USE_SAMPLE_DATA` is still `true` in `js/config.js`. Change it to `false` after adding your Sheet ID.
