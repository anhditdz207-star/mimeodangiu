/* ==========================================================
   gate.js — BINGGO slot-machine password lock. On correct
   password: play the jackpot animation, then just hide the gate.
   The real app underneath (index.html / app.js) loads its Firebase
   data in parallel the whole time the gate is up, so unlocking
   reveals the actual site immediately — no separate welcome screen.
   ========================================================== */

const PASSWORD = "27072007";
const N = 8;
const panel = document.getElementById('panel');
const leverBox = document.getElementById('leverBox');
const machine = document.getElementById('machine');
const hint = document.getElementById('hintText');
const hiddenInput = document.getElementById('hiddenInput');
const jackpotEl = document.getElementById('jackpot');
const gate = document.getElementById('gate');

/* ---- Background music: real <audio> element on purpose.
   Only an <audio>/<video> element gets an OS media session on iOS,
   which is REQUIRED for the music to keep playing after the screen
   locks or the app is backgrounded — Web Audio API alone cannot do
   this. We label it explicitly via MediaSession so the lock-screen
   widget always shows "Mimeo Data", never the spin sound. ---- */
const bgMusic = document.getElementById('bgMusic');
let musicStarted = false;

function startMusicOnce() {
  if (musicStarted) {
    if (bgMusic.paused) bgMusic.play().catch(() => {}); // resume after lock screen
    return;
  }
  bgMusic.volume = 0.5;
  bgMusic.play().then(() => {
    musicStarted = true;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Mimeo Data' });
    }
  }).catch(() => {});
}

/* ---- Spin sound: Web Audio API on purpose — it never registers an
   OS media session, so it can never "steal" the Now Playing widget
   away from bgMusic, and it mixes freely alongside it. ---- */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx, sfxGain, spinBuffer = null, spinSource = null;

function loadBuffer(url) {
  return fetch(url).then((r) => r.arrayBuffer()).then((buf) => actx.decodeAudioData(buf));
}

function setupAudioContext() {
  actx = new AudioCtx();
  sfxGain = actx.createGain();
  sfxGain.gain.value = 1;
  sfxGain.connect(actx.destination);
  loadBuffer('assets/Spinningsoundeffect.mp3').then((b) => { spinBuffer = b; }).catch(() => {});
}
setupAudioContext();

function playSpinSound() {
  if (actx.state === 'closed') { setupAudioContext(); }
  else if (actx.state === 'suspended') { actx.resume(); }
  if (!spinBuffer) return;
  stopSpinSound();
  spinSource = actx.createBufferSource();
  spinSource.buffer = spinBuffer;
  spinSource.loop = true;
  spinSource.connect(sfxGain);
  spinSource.start(0);
}

function stopSpinSound() {
  if (!spinSource) return;
  try { spinSource.stop(); } catch (e) {}
  spinSource.disconnect();
  spinSource = null;
}

// Try to start music right away; if blocked (no gesture yet), retry on
// ANY tap/click/key anywhere, and also on returning from a locked screen
// or another app (visibilitychange/pageshow/focus).
startMusicOnce();
['click', 'touchend', 'keydown'].forEach((evt) => {
  document.addEventListener(evt, startMusicOnce, { passive: true });
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) startMusicOnce(); });
window.addEventListener('pageshow', startMusicOnce);
window.addEventListener('focus', startMusicOnce);

let reels = [];
let spinTimers = [];
let enteredDigits = "";

for (let i = 0; i < N; i++) {
  const r = document.createElement('div');
  r.className = 'reel';
  r.dataset.index = i;
  const d = document.createElement('div');
  d.className = 'digit';
  d.textContent = '';
  r.appendChild(d);
  if (i === N - 1) {
    r.classList.add('last');
    r.addEventListener('click', () => { startMusicOnce(); hiddenInput.focus(); });
  }
  panel.appendChild(r);
  reels.push(r);
}

function randDigit() { return Math.floor(Math.random() * 10); }

hiddenInput.addEventListener('input', (e) => {
  let val = e.target.value.replace(/\D/g, '').slice(0, N);
  enteredDigits = val;
  for (let i = 0; i < N; i++) {
    const r = reels[i];
    const d = r.querySelector('.digit');
    if (i < val.length) {
      r.classList.remove('spinning');
      clearInterval(spinTimers[i]);
      d.textContent = '•';
      r.classList.add('pop');
      setTimeout(() => r.classList.remove('pop'), 300);
    } else if (!r.classList.contains('spinning')) {
      r.classList.add('spinning');
      spinTimers[i] = setInterval(() => { d.textContent = randDigit(); }, 60 + i * 5);
    }
  }
  if (val.length === N) {
    hint.textContent = "Kéo cần gạt để xác nhận!";
    hiddenInput.blur();
  }
});

hiddenInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && enteredDigits.length === N) pullLever();
});

leverBox.addEventListener('click', pullLever);
leverBox.addEventListener('touchstart', (e) => { e.preventDefault(); pullLever(); }, { passive: false });

function pullLever() {
  startMusicOnce();
  playSpinSound();
  leverBox.classList.add('down');
  setTimeout(() => leverBox.classList.remove('down'), 250);
  leverBox.classList.add('bounce');
  setTimeout(() => leverBox.classList.remove('bounce'), 400);

  if (enteredDigits.length === N) {
    checkPassword();
  } else {
    randomGuessSpin();
  }
}

function randomGuessSpin() {
  stopAllSpin();
  let result;
  do {
    result = '';
    for (let i = 0; i < N; i++) result += randDigit();
  } while (result === PASSWORD);

  reels.forEach((r, i) => {
    const d = r.querySelector('.digit');
    r.classList.add('spinning');
    const t = setInterval(() => { d.textContent = randDigit(); }, 50);
    setTimeout(() => {
      clearInterval(t);
      r.classList.remove('spinning');
      d.textContent = result[i];
      r.classList.add('pop');
      setTimeout(() => r.classList.remove('pop'), 300);
      if (i === N - 1) stopSpinSound();
    }, 400 + i * 180);
  });
}

function stopAllSpin() {
  spinTimers.forEach((t) => clearInterval(t));
  reels.forEach((r) => r.classList.remove('spinning'));
}

function checkPassword() {
  stopAllSpin();
  const correct = enteredDigits === PASSWORD;

  reels.forEach((r, i) => {
    const d = r.querySelector('.digit');
    r.classList.add('spinning');
    const t = setInterval(() => { d.textContent = randDigit(); }, 50);
    setTimeout(() => {
      clearInterval(t);
      r.classList.remove('spinning');
      d.textContent = '•';
      r.classList.add('pop');
      setTimeout(() => r.classList.remove('pop'), 300);
      if (i === N - 1) {
        stopSpinSound();
        setTimeout(() => (correct ? onSuccess() : onFail()), 200);
      }
    }, 400 + i * 180);
  });
}

function onSuccess() {
  hint.textContent = "";
  spawnParticles();
  machine.style.animation = 'shakeX .3s';
  setTimeout(() => { machine.style.animation = ''; }, 300);
  jackpotEl.classList.add('show');
  setTimeout(() => {
    gate.classList.add('hide');
    setTimeout(() => { gate.style.display = 'none'; }, 600);
  }, 1100);
}

function onFail() {
  machine.classList.add('shake');
  reels.forEach((r) => r.classList.add('flash'));
  setTimeout(() => {
    machine.classList.remove('shake');
    reels.forEach((r) => { r.classList.remove('flash'); r.querySelector('.digit').textContent = ''; });
    enteredDigits = "";
    hint.textContent = "Sai rồi! Thử lại nhé 🎲";
  }, 500);
}

function spawnParticles() {
  const rect = machine.getBoundingClientRect();
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = (rect.left + rect.width / 2) + 'px';
    p.style.top = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 120;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    p.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${x}px, ${y}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
    ], { duration: 700 + Math.random() * 400, easing: 'ease-out' });
    setTimeout(() => p.remove(), 1200);
  }
}
