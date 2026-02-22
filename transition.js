/* ── Garcia's Script – Dissolve Page Transition ── */

(function () {
  /* ── Create canvas overlay ── */
  const canvas = document.createElement('canvas');
  canvas.id = 'dissolve-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  /* ── Config ── */
  const PIXEL_SIZE  = 14;   // size of each dissolve block px
  const DISSOLVE_MS = 520;  // total dissolve duration
  const HOLD_MS     = 80;   // pause fully covered before navigating

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Build a shuffled grid of pixel blocks ── */
  function buildGrid() {
    const cols = Math.ceil(canvas.width  / PIXEL_SIZE) + 1;
    const rows = Math.ceil(canvas.height / PIXEL_SIZE) + 1;
    const cells = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        cells.push({ x: c * PIXEL_SIZE, y: r * PIXEL_SIZE });

    // Fisher-Yates shuffle for random dissolve order
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells;
  }

  /* ── Purple/dark palette for blocks ── */
  const COLORS = [
    'rgba(178,132,255,1)',
    'rgba(140, 90,220,1)',
    'rgba(100, 50,180,1)',
    'rgba( 30, 10, 60,1)',
    'rgba(  5,  5,  5,1)',
  ];
  const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  /* ── Dissolve IN — fill screen with pixel blocks ── */
  function dissolveIn(onComplete) {
    const cells  = buildGrid();
    const total  = cells.length;
    const colors = cells.map(() => randColor());
    const start  = performance.now();

    canvas.classList.add('active');
    canvas.style.opacity = '1';

    let lastFilled = 0;

    function draw(now) {
      const progress = Math.min((now - start) / DISSOLVE_MS, 1);
      const filled   = Math.floor(progress * total);

      // Only paint newly revealed blocks this frame
      for (let i = lastFilled; i < filled; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(cells[i].x, cells[i].y, PIXEL_SIZE + 1, PIXEL_SIZE + 1);
      }
      lastFilled = filled;

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        // Solid fill to cover any gaps
        ctx.fillStyle = 'rgb(5,5,5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setTimeout(onComplete, HOLD_MS);
      }
    }
    requestAnimationFrame(draw);
  }

  /* ── Dissolve OUT — erase pixel blocks to reveal new page ── */
  function dissolveOut() {
    const cells  = buildGrid();
    const total  = cells.length;
    const colors = cells.map(() => randColor());
    const start  = performance.now();

    // Start fully covered
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function draw(now) {
      const progress = Math.min((now - start) / DISSOLVE_MS, 1);
      const revealed = Math.floor(progress * total);

      // Repaint remaining (not-yet-revealed) blocks
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = revealed; i < total; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(cells[i].x, cells[i].y, PIXEL_SIZE + 1, PIXEL_SIZE + 1);
      }

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.remove('active');
        canvas.style.opacity = '0';
        document.body.classList.remove('exiting');
      }
    }
    requestAnimationFrame(draw);
  }

  /* ── Entrance on page load ── */
  window.addEventListener('DOMContentLoaded', () => {
    canvas.classList.add('active');
    canvas.style.opacity = '1';
    ctx.fillStyle = 'rgb(5,5,5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTimeout(() => dissolveOut(), 80);
  });

  /* ── Public navigate function ── */
  window.navigateTo = function (url) {
    if (document.body.classList.contains('exiting')) return;
    document.body.classList.add('exiting');
    dissolveIn(() => { window.location.href = url; });
  };
})();
