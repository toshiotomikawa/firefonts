// The settings page's background: a faint triangular grid of dots, each exactly one line from its six neighbours,
// mirrored around the middle of the window. Drawn once, and again only when the window's size or the theme changes.
"use strict";
(() => {
  const canvas = document.createElement("canvas");
  canvas.className = "depth";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const context = canvas.getContext("2d");

  const U = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.5; // one line
  const ROW = (U * Math.sqrt(3)) / 2; // rows sit √3/2 of a line apart
  const RADIUS = 0.75;

  function draw() {
    const ratio = devicePixelRatio || 1;
    const width = innerWidth;
    const height = innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(document.body).color;
    context.globalAlpha = 0.2;
    const centreX = width / 2;
    const centreY = height / 2;
    const rows = Math.ceil(centreY / ROW) + 1;
    const cols = Math.ceil(centreX / U) + 1;
    context.beginPath();
    for (let j = -rows; j <= rows; j++) {
      const shift = (Math.abs(j) % 2) * (U / 2);
      for (let i = -cols; i <= cols; i++) {
        const x = centreX + i * U + shift;
        const y = centreY + j * ROW;
        context.moveTo(x + RADIUS, y);
        context.arc(x, y, RADIUS, 0, 2 * Math.PI);
      }
    }
    context.fill();
  }

  let frame = 0;
  const redraw = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
  };
  addEventListener("resize", redraw);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);
  // The theme button changes the root's colour scheme.
  new MutationObserver(redraw).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  draw();
})();
