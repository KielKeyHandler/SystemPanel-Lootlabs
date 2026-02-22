/* ── Garcia's Script – Eclipse Page Transition ── */

(function () {
  const EXPAND_MS = 480;  // time for circle to cover screen
  const HOLD_MS   = 60;   // pause fully covered
  const SHRINK_MS = 480;  // time for circle to reveal new page

  let canvas, ctx, W, H, maxR;

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'eclipse-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    // Entrance: start fully covered, shrink away
    drawFull();
    canvas.style.pointerEvents = 'all';
    setTimeout(() => shrink(() => {
      canvas.style.pointerEvents = 'none';
      document.body.classList.remove('exiting');
    }), 60);
  }

  function resize() {
    if (!canvas) return;
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    maxR = Math.sqrt(W * W + H * H) / 2 + 2; // radius to cover full screen
  }

  function cx() { return W / 2; }
  function cy() { return H / 2; }

  /* Draw a full solid circle covering entire screen */
  function drawFull() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.beginPath();
    ctx.arc(cx(), cy(), maxR, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Easing — ease in-out cubic */
  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* Expand: circle grows from 0 to full */
  function expand(onComplete) {
    const start = performance.now();
    canvas.style.pointerEvents = 'all';

    (function draw(now) {
      const t = Math.min((now - start) / EXPAND_MS, 1);
      const r = ease(t) * maxR;

      ctx.clearRect(0, 0, W, H);

      /* Outer glow ring just before the edge */
      const glowR = r + 6;
      const grd = ctx.createRadialGradient(cx(), cy(), Math.max(0, r - 18), cx(), cy(), glowR);
      grd.addColorStop(0, 'rgba(178,132,255,0.0)');
      grd.addColorStop(0.5, 'rgba(178,132,255,0.55)');
      grd.addColorStop(1, 'rgba(178,132,255,0.0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx(), cy(), glowR, 0, Math.PI * 2);
      ctx.fill();

      /* Main dark circle */
      ctx.fillStyle = 'rgb(5,5,5)';
      ctx.beginPath();
      ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
      ctx.fill();

      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
        drawFull();
        setTimeout(onComplete, HOLD_MS);
      }
    })(performance.now());
  }

  /* Shrink: circle shrinks from full to 0 */
  function shrink(onComplete) {
    const start = performance.now();

    (function draw(now) {
      const t = Math.min((now - start) / SHRINK_MS, 1);
      const r = (1 - ease(t)) * maxR;

      ctx.clearRect(0, 0, W, H);

      if (r > 0.5) {
        /* Outer glow ring */
        const glowR = r + 6;
        const grd = ctx.createRadialGradient(cx(), cy(), Math.max(0, r - 18), cx(), cy(), glowR);
        grd.addColorStop(0, 'rgba(178,132,255,0.0)');
        grd.addColorStop(0.5, 'rgba(178,132,255,0.55)');
        grd.addColorStop(1, 'rgba(178,132,255,0.0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(cx(), cy(), glowR, 0, Math.PI * 2);
        ctx.fill();

        /* Main dark circle */
        ctx.fillStyle = 'rgb(5,5,5)';
        ctx.beginPath();
        ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
        if (onComplete) onComplete();
      }
    })(performance.now());
  }

  /* Public navigate */
  window.navigateTo = function (url) {
    if (document.body.classList.contains('exiting')) return;
    document.body.classList.add('exiting');
    expand(function () {
      window.location.href = url;
    });
  };

  /* Init after DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
