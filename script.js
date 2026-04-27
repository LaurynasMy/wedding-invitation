/* ═══════════════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════════════ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw0cc1LzM8itr71FLAHufMZPCo3_4P4v0nG1t_FR7WwlX2KE9VVgQgtRWJWq5BVgj8EPA/exec';
const WEDDING_DATE    = new Date(2027, 1, 12, 14, 0, 0); // Feb 12 2027, 14:00

/* ═══════════════════════════════════════════════════
   STATE — code passed from gate.html via sessionStorage
═══════════════════════════════════════════════════ */
const currentCode  = sessionStorage.getItem('weddingCode') || '';
let   attendingYes = true;

/* ═══════════════════════════════════════════════════
   START — countdown + personalized greeting on page load
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  renderGreeting();
});

/* ═══════════════════════════════════════════════════
   PERSONALIZED GREETING
═══════════════════════════════════════════════════ */
function renderGreeting() {
  const wrap     = document.getElementById('inviteGreeting');
  const nameEl   = document.getElementById('greetingName');
  const eyebrowEl = document.getElementById('greetingEyebrow');
  if (!wrap || !nameEl) return;

  const name = (sessionStorage.getItem('weddingName') || '').trim();
  if (!name) return; // leave hidden if no name stored

  nameEl.textContent = name; // textContent prevents HTML injection
  if (eyebrowEl) eyebrowEl.textContent = greetingEyebrowFor(name);
  wrap.style.display = 'block';
}

// "Jonas ir Petra" / "Jonas, Petra" → plural; "Onutė" → singular (gendered).
function greetingEyebrowFor(name) {
  const isPlural = name.includes(',') || /\bir\b/i.test(name);
  if (isPlural) return 'Mielieji,';

  const lastChar = name.toLowerCase().slice(-1);
  const isFemale = lastChar === 'a' || lastChar === 'ė' || lastChar === 'e';
  return isFemale ? 'Miela,' : 'Mielas,';
}

/* ═══════════════════════════════════════════════════
   COUNTDOWN
═══════════════════════════════════════════════════ */
function startCountdown() {
  function tick() {
    const diff = WEDDING_DATE - new Date();
    if (diff <= 0) {
      ['cd-days', 'cd-hours', 'cd-mins'].forEach(id =>
        document.getElementById(id).textContent = '00'
      );
      return;
    }
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);

    document.getElementById('cd-days').textContent  = String(days).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-mins').textContent  = String(mins).padStart(2, '0');
  }
  tick();
  setInterval(tick, 60000);
}

/* ═══════════════════════════════════════════════════
   ATTEND RADIO
═══════════════════════════════════════════════════ */
function setAttend(value) {
  attendingYes = value === 'yes';
}

/* ═══════════════════════════════════════════════════
   RSVP SUBMIT
═══════════════════════════════════════════════════ */
async function submitRSVP() {
  const nameEl    = document.getElementById('fName');
  const emailEl   = document.getElementById('fEmail');
  const msgEl     = document.getElementById('fMessage');
  const submitBtn = document.getElementById('submitBtn');
  const formMsg   = document.getElementById('formMsg');

  const name    = nameEl.value.trim();
  const email   = emailEl.value.trim();
  const message = msgEl.value.trim();

  if (!name) {
    formMsg.textContent = 'Prašome įvesti vardą.';
    formMsg.className   = 'form-msg error';
    nameEl.focus(); return;
  }
  if (!email || !email.includes('@')) {
    formMsg.textContent = 'Prašome įvesti teisingą el. paštą.';
    formMsg.className   = 'form-msg error';
    emailEl.focus(); return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Siunčiama…';
  formMsg.textContent   = '';

  try {
    await fetch(APPS_SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action:    'submitRSVP',
        code:      currentCode,
        name,
        email,
        attending: attendingYes ? 'Taip' : 'Ne',
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    // Clear fields
    nameEl.value  = '';
    emailEl.value = '';
    msgEl.value   = '';

    // Animate form out, then swap to thank-you message
    const layout = document.querySelector('.rsvp-layout');
    const done   = document.getElementById('rsvpDone');
    if (layout) layout.classList.add('is-leaving');
    setTimeout(() => {
      if (layout) layout.style.display = 'none';
      done.style.display = 'block';
      done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 450);
  } catch (err) {
    console.error(err);
    formMsg.textContent = 'Klaida siunčiant. Bandykite dar kartą.';
    formMsg.className   = 'form-msg error';
    submitBtn.disabled    = false;
    submitBtn.innerHTML   = `<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2C7.2 2 5 4.2 5 7V12H3V13H17V12H15V7C15 4.2 12.8 2 10 2Z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 13C8 14.1 8.9 15 10 15C11.1 15 12 14.1 12 13" stroke="currentColor" stroke-width="1.2" fill="none"/></svg> Siųsti`;
  }
}
