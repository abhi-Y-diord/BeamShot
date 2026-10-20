/* Soft glowing particles drifting upward behind the glass. */
(function () {
  var c = document.getElementById("stars");
  if (!c) return;
  var ctx = c.getContext("2d"), root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W, H, dots = [], color = "#8fbaff";

  function seed() {
    var n = Math.round(Math.min(80, W * H / 22000)); dots = [];
    for (var i = 0; i < n; i++) dots.push({
      x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.4,
      vy: .15 + Math.random() * .4, sway: Math.random() * 6.28, sp: .3 + Math.random() * .7, tw: Math.random() * 6.28
    });
  }
  function resize() {
    var dpr = window.devicePixelRatio || 1; W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
  }
  function readColor() { color = getComputedStyle(root).getPropertyValue("--dot").trim() || color; }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var dark = root.getAttribute("data-theme") === "dark";
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = dark ? 14 : 8;
    dots.forEach(function (d) {
      if (!reduce) {
        d.y -= d.vy; d.x += Math.sin(t * .0004 * d.sp + d.sway) * .3;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
      }
      var a = (dark ? .4 : .3) + (dark ? .4 : .25) * Math.sin(t * .002 * d.sp + d.tw);
      ctx.globalAlpha = Math.max(.05, a);
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(draw);
  }

  resize(); readColor(); addEventListener("resize", resize);
  new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  requestAnimationFrame(draw);
})();
