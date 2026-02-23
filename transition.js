/* ── Garcia's Script – Eclipse Page Transition ── */
(function () {

  var SHRINK_MS = 480;  // entrance (in) duration
  var EXPAND_MS = 480;  // exit (out) duration
  var HOLD_MS   = 80;   // pause when fully covered before navigating

  var canvas, ctx, W, H, maxR;
  var isAnimating = false;
  var rafId = null;

  /* ─────────────────────────────────────────
     INIT — called after DOM is ready
  ───────────────────────────────────────── */
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'eclipse-canvas';
    canvas.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:9999',
      'pointer-events:none',
      'display:block',
      'will-change:transform',   // GPU layer — keeps rAF running during nav
    ].join(';');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    // Page entrance: start black, shrink open
    drawFull();
    canvas.style.pointerEvents = 'all';
    setTimeout(function () {
      animateShrink(function () {
        canvas.style.pointerEvents = 'none';
        isAnimating = false;
      });
    }, 50);
  }

  /* ─────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────── */
  function resize() {
    if (!canvas) return;
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    maxR = Math.hypot(W, H) / 2 + 6;
  }

  function cx() { return W / 2; }
  function cy() { return H / 2; }

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function drawFull() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.beginPath();
    ctx.arc(cx(), cy(), maxR, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCircle(r) {
    ctx.clearRect(0, 0, W, H);
    if (r <= 0) return;

    // Purple glow halo at edge
    if (r > 4) {
      var inner = Math.max(0, r - 22);
      var outer = r + 10;
      var grd = ctx.createRadialGradient(cx(), cy(), inner, cx(), cy(), outer);
      grd.addColorStop(0,   'rgba(178,132,255,0.00)');
      grd.addColorStop(0.45,'rgba(178,132,255,0.65)');
      grd.addColorStop(1,   'rgba(178,132,255,0.00)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx(), cy(), outer, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark circle
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.beginPath();
    ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ─────────────────────────────────────────
     EXPAND (exit) — circle grows to cover screen
     Uses setTimeout loop instead of rAF so the
     browser can't skip frames during navigation
  ───────────────────────────────────────── */
  function animateExpand(onComplete) {
    var start = null;
    var FRAME = 1000 / 60; // ~16ms

    canvas.style.pointerEvents = 'all';

    function step() {
      var now = Date.now();
      if (start === null) start = now;
      var elapsed = now - start;
      var t = Math.min(elapsed / EXPAND_MS, 1);
      var r = ease(t) * maxR;

      drawCircle(r);

      if (t < 1) {
        // Use setTimeout instead of rAF — survives browser unload throttling
        setTimeout(step, FRAME);
      } else {
        drawFull();
        setTimeout(onComplete, HOLD_MS);
      }
    }

    step();
  }

  /* ─────────────────────────────────────────
     SHRINK (entrance) — circle shrinks to reveal page
     rAF is fine here since we're not navigating
  ───────────────────────────────────────── */
  function animateShrink(onComplete) {
    var start = performance.now();

    function step(now) {
      var t = Math.min((now - start) / SHRINK_MS, 1);
      drawCircle((1 - ease(t)) * maxR);

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, W, H);
        canvas.style.pointerEvents = 'none';
        if (onComplete) onComplete();
      }
    }

    rafId = requestAnimationFrame(step);
  }

  /* ─────────────────────────────────────────
     PUBLIC — navigateTo(url)
  ───────────────────────────────────────── */
  window.navigateTo = function (url) {
    // Already mid-animation — just navigate directly
    if (isAnimating) {
      window.location.href = url;
      return;
    }

    isAnimating = true;
    document.body.classList.add('exiting');

    // Hard fallback: navigate no matter what after expand + 300ms
    var hard = setTimeout(function () {
      window.location.href = url;
    }, EXPAND_MS + HOLD_MS + 300);

    animateExpand(function () {
      clearTimeout(hard);
      window.location.href = url;
    });
  };

  /* ─────────────────────────────────────────
     BOOT
  ───────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
