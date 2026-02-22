/* ── Garcia's Script – Key System ── */

const KEY_SOURCE = 'https://raw.githubusercontent.com/kielsvu/Utility/refs/heads/Lua/Utility/Major/Main.txt';
const COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 hours in milliseconds
const STORAGE_KEY = 'garcia_key_data'; // localStorage key

/* ── Stars helper ── */
function spawnStars(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  for (let i = 0; i < 110; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2 + 0.5;
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${2+Math.random()*5}s;--delay:${Math.random()*7}s;--op:${0.2+Math.random()*0.6};`;
    el.appendChild(s);
  }
}

/* ── Clock helper ── */
function startClock(clockId) {
  function update() {
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const el = document.getElementById(clockId);
    if (el) el.textContent =
      `${days[now.getDay()]} ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${ampm}`;
  }
  update();
  setInterval(update, 1000);
}

/* ── Load saved key data from localStorage ── */
function loadSavedData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/* ── Save key data to localStorage ── */
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

/* ── Check if cooldown is still active ── */
function isOnCooldown(data) {
  if (!data || !data.issuedAt) return false;
  return (Date.now() - data.issuedAt) < COOLDOWN_MS;
}

/* ── Format remaining cooldown time ── */
function formatTimeLeft(data) {
  const elapsed = Date.now() - data.issuedAt;
  const remaining = COOLDOWN_MS - elapsed;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

/* ── Fetch keys from GitHub and return as array ── */
async function fetchKeys() {
  const res = await fetch(KEY_SOURCE + '?nocache=' + Date.now());
  const text = await res.text();
  return text.split('\n').map(k => k.trim()).filter(k => k.length > 0);
}

/* ── Main: get a key for this user ── */
async function getKey() {
  const keyEl     = document.getElementById('keyValue');
  const subEl     = document.querySelector('.sub');
  const cooldownEl = document.getElementById('cooldownTimer');

  // Show loading state
  if (keyEl) keyEl.textContent = 'Loading...';

  // Check if user already has a valid key within 20 hours
  const saved = loadSavedData();
  if (saved && isOnCooldown(saved)) {
    // Show existing key + countdown
    if (keyEl) keyEl.textContent = saved.key;
    if (subEl) subEl.textContent = 'Your existing key — resets after cooldown';
    startCooldownTimer(saved, cooldownEl);
    return;
  }

  // Fetch fresh keys from GitHub
  try {
    const allKeys = await fetchKeys();

    // Get list of previously used keys from localStorage
    let usedKeys = [];
    try {
      usedKeys = JSON.parse(localStorage.getItem('garcia_used_keys') || '[]');
    } catch (e) {}

    // Filter out already-used keys
    let available = allKeys.filter(k => !usedKeys.includes(k));

    // If all keys are used, reset used list (cycle)
    if (available.length === 0) {
      available = allKeys;
      localStorage.removeItem('garcia_used_keys');
      usedKeys = [];
    }

    // Pick a random key from available ones
    const picked = available[Math.floor(Math.random() * available.length)];

    // Mark as used
    usedKeys.push(picked);
    try {
      localStorage.setItem('garcia_used_keys', JSON.stringify(usedKeys));
    } catch (e) {}

    // Save this user's key + timestamp
    const data = { key: picked, issuedAt: Date.now() };
    saveData(data);

    // Display it
    if (keyEl) keyEl.textContent = picked;
    if (subEl) subEl.textContent = 'All checkpoints complete — here is your script key';
    startCooldownTimer(data, cooldownEl);

  } catch (err) {
    // Network error fallback
    if (keyEl) keyEl.textContent = 'Error — please refresh';
    if (subEl) subEl.textContent = 'Could not load keys. Check your connection.';
  }
}

/* ── Cooldown countdown display ── */
function startCooldownTimer(data, el) {
  if (!el) return;

  function tick() {
    if (!isOnCooldown(data)) {
      el.textContent = '🔓 Key expired — refresh for a new one';
      el.style.color = 'rgba(255,255,255,0.4)';
      // Clear saved data so next visit gets a fresh key
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    el.textContent = `⏳ Key valid for: ${formatTimeLeft(data)}`;
    setTimeout(tick, 1000);
  }

  tick();
}

/* ── Copy key to clipboard ── */
function copyKey() {
  const key = document.getElementById('keyValue').textContent;
  if (!key || key === 'Loading...' || key === 'Error — please refresh') return;

  const btn = document.getElementById('copyBtn');

  navigator.clipboard.writeText(key).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = key;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });

  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = 'Copy';
    btn.classList.remove('copied');
  }, 2000);
}
