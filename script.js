/* ═══════════════════════════════════════════════════
   CONFIGURATION
═══════════════════════════════════════════════════ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzh3XFfU1PqIDs5NHLcXV5DduXd03CojDnj_2Inl6hLgn44J5Kgd2odD8qF_bB9B_VkIg/exec';
const WEDDING_DATE    = new Date(2027, 1, 12, 14, 0, 0); // Feb 12 2027, 14:00

/* ═══════════════════════════════════════════════════
   STATE — code passed from gate.html via sessionStorage
═══════════════════════════════════════════════════ */
const currentCode  = sessionStorage.getItem('weddingCode') || '';
let   attendingYes = true;

/* ═══════════════════════════════════════════════════
   START — countdown runs immediately on page load
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', startCountdown);

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

    document.getElementById('rsvpFormWrap').style.display = 'none';
    document.getElementById('rsvpDone').style.display     = 'block';
  } catch (err) {
    console.error(err);
    formMsg.textContent = 'Klaida siunčiant. Bandykite dar kartą.';
    formMsg.className   = 'form-msg error';
    submitBtn.disabled    = false;
    submitBtn.innerHTML   = `<svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M10 2C7.2 2 5 4.2 5 7V12H3V13H17V12H15V7C15 4.2 12.8 2 10 2Z" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 13C8 14.1 8.9 15 10 15C11.1 15 12 14.1 12 13" stroke="currentColor" stroke-width="1.2" fill="none"/></svg> Siųsti`;
  }
}
