/* ── Garcia's Script – Dissolve Page Transition ── */

(function () {
  const PIXEL_SIZE  = 14;
  const DISSOLVE_MS = 520;
  const HOLD_MS     = 80;
  const COLORS = [
    'rgba(178,132,255,1)',
    'rgba(140,90,220,1)',
    'rgba(100,50,180,1)',
    'rgba(30,10,60,1)',
    'rgba(5,5,5,1)',
  ];
  const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  let canvas, ctx;

  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'dissolve-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:0;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    // Entrance: start covered, dissolve away
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'all';
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => dissolveOut(), 60);
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function buildGrid() {
    const cols = Math.ceil(canvas.width / PIXEL_SIZE) + 1;
    const rows = Math.ceil(canvas.height / PIXEL_SIZE) + 1;
    const cells = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        cells.push({ x: c * PIXEL_SIZE, y: r * PIXEL_SIZE });
    // Shuffle
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells;
  }

  function dissolveIn(onComplete) {
    const cells  = buildGrid();
    const total  = cells.length;
    const colors = cells.map(() => randColor());
    const start  = performance.now();
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'all';
    let last = 0;

    (function draw(now) {
      const p      = Math.min((now - start) / DISSOLVE_MS, 1);
      const filled = Math.floor(p * total);
      for (let i = last; i < filled; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(cells[i].x, cells[i].y, PIXEL_SIZE + 1, PIXEL_SIZE + 1);
      }
      last = filled;
      if (p < 1) {
        requestAnimationFrame(draw);
      } else {
        ctx.fillStyle = 'rgb(5,5,5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setTimeout(onComplete, HOLD_MS);
      }
    })(performance.now());
  }

  function dissolveOut() {
    const cells  = buildGrid();
    const total  = cells.length;
    const colors = cells.map(() => randColor());
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const start = performance.now();

    (function draw(now) {
      const p   = Math.min((now - start) / DISSOLVE_MS, 1);
      const rev = Math.floor(p * total);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = rev; i < total; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(cells[i].x, cells[i].y, PIXEL_SIZE + 1, PIXEL_SIZE + 1);
      }
      if (p < 1) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.opacity = '0';
        canvas.style.pointerEvents = 'none';
        document.body.classList.remove('exiting');
      }
    })(performance.now());
  }

  // Public navigate — call this instead of window.location.href
  window.navigateTo = function (url) {
    if (document.body.classList.contains('exiting')) return;
    document.body.classList.add('exiting');
    dissolveIn(function () {
      window.location.href = url;
    });
  };

  // Init after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
