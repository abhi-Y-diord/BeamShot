(function () {
  var left = parseInt(document.getElementById("app").dataset.remaining, 10);
  var out = document.getElementById("countdown");
  function tick() {
    if (left <= 0) { out.textContent = "This link has expired"; return; }
    var m = Math.floor(left / 60), s = String(left % 60).padStart(2, "0");
    out.textContent = "Link expires in " + m + ":" + s;
    left -= 1; setTimeout(tick, 1000);
  }
  tick();
})();
