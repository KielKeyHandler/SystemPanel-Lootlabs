/* ── Garcia's Script – Page Transition ── */

// Create overlay element once
(function() {
  const overlay = document.createElement('div');
  overlay.className = 'transition-overlay enter';
  document.body.appendChild(overlay);

  // Remove enter class after animation completes
  overlay.addEventListener('animationend', () => {
    overlay.classList.remove('enter');
    document.body.classList.remove('entering');
  }, { once: true });

  document.body.classList.add('entering');
})();

// Call this instead of window.location.href = url
function navigateTo(url) {
  const overlay = document.querySelector('.transition-overlay');
  document.body.classList.add('exiting');
  overlay.classList.add('exit');

  overlay.addEventListener('animationend', () => {
    window.location.href = url;
  }, { once: true });
}
