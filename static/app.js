(function () {
  var $ = function (id) { return document.getElementById(id); };
  var app = $("app");
  var MAX = parseInt(app.dataset.maxMb, 10) * 1024 * 1024;
  var BLOCKED = ["exe", "msi", "dll", "scr", "com", "pif", "cpl", "hta", "msc"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var files = [];

  var drop = $("drop"), input = $("input"), list = $("list"), errorEl = $("error");
  var uploadBtn = $("uploadBtn"), folder = drop.querySelector(".folder");
  var launch = $("launch"), pct = $("pct"), lines = $("lines");
  var LABEL_EMPTY = "Choose files", LABEL_READY = "Upload and get QR code";

  function size(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
    return (n / 1024 / 1024).toFixed(1) + " MB";
  }
  function extOf(n) { var i = n.lastIndexOf("."); return i < 0 ? "" : n.slice(i + 1).toLowerCase(); }
  function total() { return files.reduce(function (s, f) { return s + f.size; }, 0); }

  function render() {
    list.innerHTML = "";
    files.forEach(function (f, i) {
      var li = document.createElement("li");
      var ext = document.createElement("span"); ext.className = "ext"; ext.textContent = (extOf(f.name) || "file").slice(0, 5).toUpperCase();
      var name = document.createElement("span"); name.className = "name"; name.textContent = f.name; name.title = f.name;
      var sz = document.createElement("span"); sz.className = "size"; sz.textContent = size(f.size);
      var rm = document.createElement("button"); rm.type = "button"; rm.textContent = "\u00d7";
      rm.setAttribute("aria-label", "Remove " + f.name);
      rm.addEventListener("click", function () { files.splice(i, 1); errorEl.textContent = ""; render(); });
      li.append(ext, name, sz, rm); list.appendChild(li);
    });
    list.hidden = !files.length;
    uploadBtn.textContent = files.length ? LABEL_READY : LABEL_EMPTY;
    uploadBtn.disabled = total() > MAX;
  }

  function add(incoming) {
    errorEl.textContent = "";
    Array.prototype.forEach.call(incoming, function (f) {
      if (BLOCKED.indexOf(extOf(f.name)) !== -1) { errorEl.textContent = f.name + " can\u2019t be sent. Program files (.exe, .msi, .dll) are not allowed."; return; }
      if (files.some(function (x) { return x.name === f.name && x.size === f.size; })) return;
      files.push(f);
    });
    if (total() > MAX) errorEl.textContent = "Too big. The limit is " + (MAX / 1024 / 1024) + " MB per upload. Remove a file to continue.";
    render();
  }

  /* ----- choosing files ----- */
  function openFolder() {
    folder.classList.add("open");
    setTimeout(function () { folder.classList.remove("open"); }, 1000);
  }
  drop.addEventListener("click", openFolder);
  input.addEventListener("change", function () { add(input.files); input.value = ""; });
  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) { add(e.dataTransfer.files); });

  var pasted = 0;
  document.addEventListener("paste", function (e) {
    if ($("uploader").hidden) return;
    var items = (e.clipboardData && e.clipboardData.files) || [], out = [];
    Array.prototype.forEach.call(items, function (f) {
      if (f.type.indexOf("image/") === 0 && /^image\.[a-z]+$/i.test(f.name)) {
        pasted += 1;
        var ext = f.type.split("/")[1].replace("jpeg", "jpg");
        out.push(new File([f], "pasted-" + pasted + "." + ext, { type: f.type }));
      } else out.push(f);
    });
    if (out.length) add(out);
  });

  /* ----- main button: opens the folder first, uploads once there are files ----- */
  uploadBtn.addEventListener("click", function () {
    if (!files.length) { openFolder(); setTimeout(function () { input.click(); }, 380); return; }
    startUpload();
  });

  /* ----- rocket ----- */
  (function buildLines() {
    for (var i = 0; i < 22; i++) {
      var l = document.createElement("i");
      l.style.left = (Math.random() * 100) + "%";
      l.style.height = (60 + Math.random() * 120) + "px";
      l.style.animationDuration = (.5 + Math.random() * .7) + "s";
      l.style.animationDelay = (-Math.random() * 1.2) + "s";
      l.style.opacity = (.35 + Math.random() * .5);
      lines.appendChild(l);
    }
  })();
  function openLaunch() {
    launch.className = "launch"; launch.hidden = false;
    void launch.offsetWidth; launch.classList.add("ready");
  }
  function closeLaunch() { launch.hidden = true; launch.className = "launch"; }
  function setPct(p) {
    pct.textContent = "Uploading\u2026 " + p + "%";
    uploadBtn.textContent = "Uploading\u2026 " + p + "%";
  }

  function fail(msg) {
    closeLaunch(); errorEl.textContent = msg; render();
  }

  function startUpload() {
    errorEl.textContent = ""; uploadBtn.disabled = true;
    var data = new FormData();
    files.forEach(function (f) { data.append("files", f, f.name); });
    var t0 = Date.now();
    if (!reduce) openLaunch();
    setPct(0);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload");
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) setPct(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = function () {
      var res = {};
      try { res = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status !== 200) return fail(res.error || "Upload failed. Please try again.");
      finish(res, t0);
    };
    xhr.onerror = function () { fail("Could not reach the server. Check that it is running."); };
    xhr.send(data);
  }

  function finish(res, t0) {
    if (reduce) return showResult(res);
    pct.textContent = "Done";
    var wait = Math.max(0, 1900 - (Date.now() - t0));   // let the rocket be seen, even for tiny uploads
    setTimeout(function () {
      launch.classList.add("go");
      setTimeout(function () {
        showResult(res);
        launch.classList.add("fade");
        setTimeout(closeLaunch, 450);
      }, 950);
    }, wait);
  }

  /* ----- result ----- */
  var timer;
  function showResult(res) {
    $("uploader").hidden = true; $("result").hidden = false;
    $("qr").src = res.qr + "?t=" + Date.now();
    $("link").value = res.url;
    var left = res.expires_in;
    clearInterval(timer);
    function tick() {
      if (left <= 0) { clearInterval(timer); $("expires").textContent = "This link has expired."; return; }
      var m = Math.floor(left / 60), s = String(left % 60).padStart(2, "0");
      $("expires").textContent = res.count + (res.count === 1 ? " file" : " files") + " ready. Expires in " + m + ":" + s + ".";
      left -= 1;
    }
    tick(); timer = setInterval(tick, 1000);
  }

  $("copy").addEventListener("click", function () {
    var btn = $("copy");
    function done() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy link"; }, 1500); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText($("link").value).then(done);
    else { $("link").select(); document.execCommand("copy"); done(); }
  });

  $("again").addEventListener("click", function () {
    clearInterval(timer); files = []; errorEl.textContent = "";
    $("result").hidden = true; $("uploader").hidden = false; render();
  });

  render();
})();
