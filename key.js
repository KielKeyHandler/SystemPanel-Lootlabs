/* ── Garcia's Script – Key System ── */

var KEY_SOURCE  = 'https://raw.githubusercontent.com/kielsvu/Utility/refs/heads/Lua/Utility/Major/Main.txt';
var COOLDOWN_MS = 20 * 60 * 60 * 1000;
var STORAGE_KEY = 'garcia_key_data';

/* ── Stars ── */
function spawnStars(id) {
  var el = document.getElementById(id);
  if (!el) return;
  for (var i = 0; i < 110; i++) {
    var s = document.createElement('div');
    s.className = 'star';
    var sz = Math.random() * 2 + 0.5;
    s.style.cssText = 'width:'+sz+'px;height:'+sz+'px;top:'+(Math.random()*100)+'%;left:'+(Math.random()*100)+'%;--d:'+(2+Math.random()*5)+'s;--delay:'+(Math.random()*7)+'s;--op:'+(0.2+Math.random()*0.6)+';';
    el.appendChild(s);
  }
}

/* ── Clock ── */
function startClock(id) {
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function tick() {
    var now = new Date(), h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    var ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    var el = document.getElementById(id);
    if (el) el.textContent = days[now.getDay()]+' '+pad(h)+':'+pad(m)+':'+pad(s)+' '+ap;
  }
  function pad(n) { return String(n).padStart(2,'0'); }
  tick(); setInterval(tick, 1000);
}

/* ── Storage ── */
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) { return null; }
}
function saveDat(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch(e) {}
}
function onCooldown(d) {
  return d && d.issuedAt && (Date.now() - d.issuedAt) < COOLDOWN_MS;
}
function timeLeft(d) {
  var r = COOLDOWN_MS - (Date.now() - d.issuedAt);
  var h = Math.floor(r/3600000), m = Math.floor((r%3600000)/60000), s = Math.floor((r%60000)/1000);
  return pad(h)+'h '+pad(m)+'m '+pad(s)+'s';
  function pad(n) { return String(n).padStart(2,'0'); }
}

/* ── Fetch with retry ── */
async function fetchKeys() {
  var url = KEY_SOURCE + '?t=' + Date.now();
  var res, lastErr;
  for (var i = 1; i <= 3; i++) {
    try {
      res = await fetch(url, { method:'GET', cache:'no-store' });
      if (res.ok) break;
    } catch(e) {
      lastErr = e;
      if (i < 3) await new Promise(function(r){ setTimeout(r, 700*i); });
    }
  }
  if (!res || !res.ok) throw new Error('Fetch failed');
  var text = await res.text();
  var keys = text.split('\n').map(function(k){ return k.trim(); }).filter(function(k){ return k.length > 0; });
  if (!keys.length) throw new Error('Empty key list');
  return keys;
}

/* ── Pick unused key ── */
function pickKey(all) {
  var used = [];
  try { used = JSON.parse(localStorage.getItem('garcia_used_keys') || '[]'); } catch(e) {}
  var avail = all.filter(function(k){ return used.indexOf(k) === -1; });
  if (!avail.length) { avail = all; used = []; try { localStorage.removeItem('garcia_used_keys'); } catch(e) {} }
  var picked = avail[Math.floor(Math.random() * avail.length)];
  used.push(picked);
  try { localStorage.setItem('garcia_used_keys', JSON.stringify(used)); } catch(e) {}
  return picked;
}

/* ── Main ── */
async function getKey() {
  var keyEl      = document.getElementById('keyValue');
  var subEl      = document.getElementById('subText'); // matches key.html id
  var timerEl    = document.getElementById('cooldownTimer');

  if (keyEl) keyEl.textContent = 'Loading...';

  var saved = loadSaved();
  if (saved && onCooldown(saved)) {
    if (keyEl) keyEl.textContent = saved.key;
    if (subEl) subEl.textContent = 'Your existing key — resets after cooldown';
    startTimer(saved, timerEl);
    return;
  }

  try {
    var all    = await fetchKeys();
    var picked = pickKey(all);
    var data   = { key: picked, issuedAt: Date.now() };
    saveDat(data);
    if (keyEl) keyEl.textContent = picked;
    if (subEl) subEl.textContent = 'All checkpoints complete — here is your script key';
    startTimer(data, timerEl);
  } catch(err) {
    if (keyEl) keyEl.textContent = 'Error loading key';
    if (subEl) subEl.innerHTML = 'Could not load. <a href="javascript:getKey()" style="color:var(--gold);text-decoration:underline;">Tap to retry</a>';
    if (timerEl) timerEl.textContent = '⚠ Check your connection';
  }
}

/* ── Countdown timer ── */
function startTimer(data, el) {
  if (!el) return;
  function tick() {
    if (!onCooldown(data)) {
      el.textContent = '🔓 Key expired — refresh for a new one';
      el.style.color = 'rgba(255,255,255,0.35)';
      try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
      return;
    }
    el.textContent = '⏳ Key valid for: ' + timeLeft(data);
    setTimeout(tick, 1000);
  }
  tick();
}

/* ── Copy ── */
function copyKey() {
  var key = document.getElementById('keyValue').textContent;
  if (!key || key === 'Loading...' || key === 'Error loading key') return;
  var btn = document.getElementById('copyBtn');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(key).then(function(){ flash(btn); }).catch(function(){ fallback(key, btn); });
  } else {
    fallback(key, btn);
  }
}
function fallback(text, btn) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
  flash(btn);
}
function flash(btn) {
  if (!btn) return;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(function(){ btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}
