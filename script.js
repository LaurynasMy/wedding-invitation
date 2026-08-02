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
   START — countdown + photo strips on page load
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  startCountdown();
  buildPhotoStrips();
  fitHeroNames();
});

/* ═══════════════════════════════════════════════════
   HERO NAME FIT — keeps the script names inside the
   screen: shrinks them a little only when they do not
   fit between the side paddings (narrow phones)
═══════════════════════════════════════════════════ */
function fitHeroNames() {
  const stack = document.querySelector('.hero-names-stack');
  if (!stack) return;

  const cs    = getComputedStyle(stack);
  const avail = stack.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);

  stack.querySelectorAll('.hero-name-first, .hero-name-second').forEach(el => {
    el.style.fontSize = '';                        // start from the stylesheet size
    let size  = parseFloat(getComputedStyle(el).fontSize);
    let guard = 40;                                // safety cap on iterations
    while (el.scrollWidth > avail && size > 28 && guard-- > 0) {
      size *= 0.96;                                // shave 4% until it fits
      el.style.fontSize = `${size}px`;
    }
  });
}

// Re-fit once the handwriting font finishes loading, and on resize/rotation
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroNames);
window.addEventListener('resize', fitHeroNames);

/* ═══════════════════════════════════════════════════
   STORY PHOTO STRIPS
   Top strip = pirmas/, bottom strip = antras/.
   Photos are discovered automatically by number:
   name them 1.jpeg, 2.jpeg, 3.jpeg … with no gaps —
   the strip stops at the first missing number.
   Add / rename / reorder files in the folder,
   no code changes needed.
═══════════════════════════════════════════════════ */
const STRIP_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp'];
const STRIP_MAX_PHOTOS = 100;
const STRIP_CHUNK      = 10; // how many numbers are checked in parallel

function buildPhotoStrips() {
  fillStrip('storyStripTop',    'pirmas');
  fillStrip('storyStripBottom', 'antras');
}

async function fillStrip(stripId, folder) {
  const strip = document.getElementById(stripId);
  if (!strip) return;

  outer:
  for (let n = 1; n <= STRIP_MAX_PHOTOS; n += STRIP_CHUNK) {
    const lookups = [];
    for (let i = n; i < n + STRIP_CHUNK && i <= STRIP_MAX_PHOTOS; i++) {
      lookups.push(findPhoto(folder, i));
    }
    for (const lookup of lookups) {
      const src = await lookup;
      if (!src) break outer; // first missing number = end of strip
      strip.appendChild(makePhotoCard(src));
    }
  }

  // Folder not numbered yet (or empty) — collapse the empty band
  if (!strip.children.length) strip.style.display = 'none';
}

// Try each known extension for photo number n; null if none exists.
async function findPhoto(folder, n) {
  for (const ext of STRIP_EXTENSIONS) {
    const src = `${folder}/${n}.${ext}`;
    if (await imageExists(src)) return src;
  }
  return null;
}

function imageExists(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

function makePhotoCard(src) {
  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.className = 'story-card';
  btn.setAttribute('aria-label', 'Padidinti nuotrauką');
  btn.addEventListener('click', () => openLightbox(src));

  const img = document.createElement('img');
  img.src     = src;
  img.alt     = '';
  img.loading = 'lazy';

  btn.appendChild(img);
  return btn;
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
   LIGHTBOX — story bubble photos open full size
═══════════════════════════════════════════════════ */
function openLightbox(src) {
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if (!box || !img) return;
  img.src = src;
  box.classList.add('open');
  document.body.style.overflow = 'hidden'; // lock scroll behind overlay
}

function closeLightbox() {
  const box = document.getElementById('lightbox');
  if (!box) return;
  box.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

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
  const msgEl     = document.getElementById('fMessage');
  const submitBtn = document.getElementById('submitBtn');
  const formMsg   = document.getElementById('formMsg');

  const name    = nameEl.value.trim();
  const message = msgEl.value.trim();

  if (!name) {
    formMsg.textContent = 'Prašome įvesti vardą.';
    formMsg.className   = 'form-msg error';
    nameEl.focus(); return;
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
        attending: attendingYes ? 'Taip' : 'Ne',
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    // Clear fields
    nameEl.value  = '';
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
