/**
 * ═══════════════════════════════════════════════════════════════
 *  WEDDING INVITATION — Google Apps Script Backend
 *
 *  Handles two actions:
 *    GET  ?action=validateCode&code=XXX  → { valid: true/false }
 *    POST { action:"submitRSVP", code, name, email,
 *           attending, message, timestamp }  → { success: true/false }
 *
 *  Sheet tab name must match SHEET_NAME below.
 *  Column layout:
 *    A = Kodas | B = Vardas | C = El. paštas |
 *    D = Dalyvavimas | E = Žinutė | F = Laikas
 * ═══════════════════════════════════════════════════════════════
 */

const SHEET_NAME = 'Svečiai';

// ── GET: validate code ─────────────────────────────────────────
function doGet(e) {
  const params = e.parameter;
  if (params.action === 'validateCode') {
    const code  = (params.code || '').toString().trim().toUpperCase();
    const valid = isValidCode(code);
    return jsonResponse({ valid });
  }
  return jsonResponse({ error: 'Unknown action' });
}

// ── POST: submit RSVP ──────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'submitRSVP') {
      return jsonResponse(writeRSVP(payload));
    }
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── Helpers ────────────────────────────────────────────────────
function isValidCode(code) {
  const sheet = getSheet();
  const codes = sheet.getRange('A2:A').getValues();
  for (let i = 0; i < codes.length; i++) {
    if ((codes[i][0] || '').toString().trim().toUpperCase() === code) return true;
  }
  return false;
}

function writeRSVP(p) {
  const code  = (p.code || '').toString().trim().toUpperCase();
  const sheet = getSheet();
  const codes = sheet.getRange('A2:A').getValues();

  for (let i = 0; i < codes.length; i++) {
    if ((codes[i][0] || '').toString().trim().toUpperCase() === code) {
      const row = i + 2;
      sheet.getRange(row, 2).setValue(p.name      || '');
      sheet.getRange(row, 3).setValue(p.email     || '');
      sheet.getRange(row, 4).setValue(p.attending || '');
      sheet.getRange(row, 5).setValue(p.message   || '');
      sheet.getRange(row, 6).setValue(p.timestamp || new Date().toISOString());
      return { success: true };
    }
  }
  return { success: false, error: 'Code not found' };
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found`);
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
