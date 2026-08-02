# 💍 Vestuvių Kvietimas — Setup Guide

Wedding invitation site with code-gated access and Google Sheets RSVP integration.

---

## File Structure

```
wedding-invitation/
├── index.html   — website (gate + invitation + RSVP)
├── style.css    — all styling
├── script.js    — countdown, code validation, form logic
├── Code.gs      — Google Apps Script backend (paste into Google)
└── README.md    — this file
```

---

## Step 1 — Set up Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → create a new spreadsheet.
2. Rename the sheet tab to **`Svečiai`** (right-click tab → Rename).
3. Add headers in **row 1**:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Kodas | Vardas | El. paštas | Dalyvavimas | Žinutė | Laikas |

4. Add guest codes in column A starting from **row 2**:
```
LAURA01
JONAS02
PETRAS03
```

---

## Step 2 — Add Apps Script

1. In your sheet: **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Paste the full contents of `Code.gs`
4. Save (Ctrl+S)

---

## Step 3 — Deploy as Web App

1. **Deploy → New deployment**
2. Click ⚙️ gear → **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone** ← required
4. Click **Deploy** → authorize when prompted
5. Copy the Web app URL (looks like `https://script.google.com/macros/s/AKfycb.../exec`)

> ⚠️ After any changes to Code.gs, always create a **New deployment** — not "Manage deployments". Then update the URL in script.js.

---

## Step 4 — Connect to Website

Open `script.js`, find:
```js
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```
Replace with your URL from Step 3.

---

## Step 5 — Customise Content

**In `index.html`**, update:
- Names: `Laura ir Mantas`, `Laura`, `Mantas`
- Date: `2026 · Rugsėjo 11 d.` and `2026-09-11`
- Ceremony location and Google Maps links
- Reception location and Google Maps links
- RSVP deadline

**In `script.js`**, update the wedding date:
```js
// new Date(YEAR, MONTH-1, DAY, HOUR, MINUTE, SECOND)
const WEDDING_DATE = new Date(2026, 8, 11, 14, 0, 0); // Sep = 8
```

---

## Step 6 — Deploy to GitHub Pages

```bash
git add .
git commit -m "Wedding site"
git push origin main
```

In GitHub repo → **Settings → Pages** → Source: `main` / `/ (root)` → Save.

Your site will be live at:
```
https://YOUR_USERNAME.github.io/wedding-invitation/
```

---

## Data Flow

```
Guest enters code
  → GET to Apps Script → checks Sheet column A
  → valid: show invitation page

Guest submits RSVP form
  → POST to Apps Script → finds code row → writes B–F
  → Google Sheet updated automatically
```

---

## Adding Guest Codes

Just add new rows in column A of your Google Sheet. No code changes needed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Code always invalid | Set "Who has access" to **Anyone** in deployment |
| RSVP fails silently | Open browser console (F12), check for errors; redeploy after Code.gs changes |
| GitHub Pages not loading | Wait 2–3 min; ensure `index.html` is in root folder |
| Old code changes not working | Create a **New deployment** (not update existing) |
