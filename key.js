const KEY_URL =
"https://raw.githubusercontent.com/kielsvu/Utility/refs/heads/Lua/Utility/Major/Main.txt";

const WEBHOOK_URL =
"https://discord.com/api/webhooks/1466775635769819188/RvsbULvmOYHFOnClihLEhqWs5PkncsF5qnkMqOMs5v2Wco4vx1oiEkmB2EfyUpaw3vTp";

const COOLDOWN = 5 * 60 * 60 * 1000; // 5 hours
const keyBox = document.getElementById("key");

// device detection
function getDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (/android|iphone|ipad/.test(ua)) return "Mobile";
  if (/windows/.test(ua)) return "Windows PC";
  if (/mac/.test(ua)) return "Mac";
  return "Unknown";
}

// load used keys (per device)
const usedKeys = JSON.parse(localStorage.getItem("usedKeys") || "{}");

// clean expired keys
const now = Date.now();
for (const k in usedKeys) {
  if (now - usedKeys[k] > COOLDOWN) delete usedKeys[k];
}
localStorage.setItem("usedKeys", JSON.stringify(usedKeys));

// fetch keys
fetch(KEY_URL)
  .then(r => r.text())
  .then(text => {
    const allKeys = text.trim().split(/\s+/);
    const available = allKeys.filter(k => !usedKeys[k]);

    if (!available.length) {
      keyBox.textContent = "No keys available, try later";
      return;
    }

    const key = available[Math.floor(Math.random() * available.length)];
    usedKeys[key] = now;
    localStorage.setItem("usedKeys", JSON.stringify(usedKeys));

    keyBox.textContent = key;
    sendWebhook(key);
  })
  .catch(() => keyBox.textContent = "Failed to load key");

// webhook logger
function sendWebhook(key) {
  const payload = {
    embeds: [{
      title: "🔑 Key Issued",
      color: 0x00c8ff,
      fields: [
        { name: "Key", value: `\`${key}\`` },
        { name: "Time", value: new Date().toLocaleString() },
        { name: "Device", value: getDevice() }
      ],
      footer: { text: "GitHub Pages Key System" }
    }]
  };

  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
}
