"""Beamshot: send files from one device to another with a QR code.

Files are stored untouched (no resizing, no re-encoding) and deleted automatically.
"""
import io
import mimetypes
import os
import secrets
import shutil
import socket
import threading
import time
import zipfile
from pathlib import Path

import segno
from flask import (Flask, abort, jsonify, render_template, request, send_file,
                   send_from_directory)
from werkzeug.utils import secure_filename

APP_NAME = "Beamshot"      # change this to rename the site
MAX_TOTAL_MB = 50          # total size allowed per transfer
MAX_FILES = 30             # files allowed per transfer
EXPIRY_MINUTES = 30        # files are deleted after this long

# Everything is accepted (images, PDFs, code, ZIPs...) except programs that run on their own.
BLOCKED = {"exe", "msi", "dll", "scr", "com", "pif", "cpl", "hta", "msc"}
IMAGE_EXTS = {"png", "jpg", "jpeg", "gif", "webp", "bmp"}

# Make sure Windows registry settings cannot break CSS/JS/SVG/font delivery.
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("font/woff2", ".woff2")

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_ROOT = BASE_DIR / "uploads"

app = Flask(__name__)
# Small allowance on top of the file limit for multipart overhead.
# Always read page templates fresh from disk, so a running server never shows stale pages.
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.jinja_env.auto_reload = True
app.config["MAX_CONTENT_LENGTH"] = (MAX_TOTAL_MB + 2) * 1024 * 1024

transfers = {}             # token -> {"files": [{"name", "size", "ext", "image"}], "expires": unix time}
lock = threading.Lock()


# ---------- helpers ----------

def ext_of(name):
    return name.rsplit(".", 1)[-1].lower() if "." in name else ""


def lan_ip():
    """The laptop's address on the local network, so a phone can reach it."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def public_base():
    """Base URL to put inside the QR code."""
    fixed = os.environ.get("PUBLIC_URL")
    if fixed:
        return fixed.rstrip("/")
    host = request.host
    name, _, port = host.partition(":")
    if name in ("localhost", "127.0.0.1"):
        host = f"{lan_ip()}:{port}" if port else lan_ip()
    return f"{request.scheme}://{host}"


def get_transfer(token):
    with lock:
        item = transfers.get(token)
        if item and item["expires"] > time.time():
            return item
    return None


def purge_expired():
    now = time.time()
    with lock:
        dead = [t for t, v in transfers.items() if v["expires"] <= now]
        for t in dead:
            transfers.pop(t, None)
    for t in dead:
        shutil.rmtree(UPLOAD_ROOT / t, ignore_errors=True)


def janitor():
    while True:
        time.sleep(30)
        purge_expired()


def fresh_start():
    UPLOAD_ROOT.mkdir(exist_ok=True)
    for child in UPLOAD_ROOT.iterdir():
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)


def unique_name(name, used):
    stem, dot, ext = name.rpartition(".")
    if not dot:
        stem, ext = name, ""
    candidate, n = name, 1
    while candidate.lower() in used:
        n += 1
        candidate = f"{stem}-{n}{dot}{ext}"
    used.add(candidate.lower())
    return candidate


def human_size(n):
    for unit in ("B", "KB", "MB"):
        if n < 1024 or unit == "MB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024


app.jinja_env.filters["size"] = human_size


@app.context_processor
def inject_globals():
    static = BASE_DIR / "static"
    newest = max((f.stat().st_mtime for f in static.rglob("*") if f.is_file()), default=0)
    return {"app_name": APP_NAME, "asset_v": int(newest)}


@app.after_request
def headers(resp):
    resp.headers["Cache-Control"] = "no-store"
    resp.headers["X-Content-Type-Options"] = "nosniff"
    return resp


@app.errorhandler(413)
def too_large(_):
    return jsonify(error=f"Too big. The limit is {MAX_TOTAL_MB} MB per upload."), 413


# ---------- pages ----------

@app.get("/")
def index():
    return render_template("index.html", max_mb=MAX_TOTAL_MB, expiry=EXPIRY_MINUTES)


@app.get("/d/<token>")
def download_page(token):
    item = get_transfer(token)
    if not item:
        return render_template("expired.html"), 404
    remaining = int(item["expires"] - time.time())
    return render_template("download.html", token=token, files=item["files"], remaining=remaining)


# ---------- API ----------

@app.post("/upload")
def upload():
    files = [f for f in request.files.getlist("files") if f and f.filename]
    if not files:
        return jsonify(error="Choose at least one file."), 400
    if len(files) > MAX_FILES:
        return jsonify(error=f"Please send at most {MAX_FILES} files at a time. Zip them together if you have more."), 400

    token = secrets.token_urlsafe(9)
    folder = UPLOAD_ROOT / token
    folder.mkdir(parents=True)
    saved, used, total = [], set(), 0
    max_bytes = MAX_TOTAL_MB * 1024 * 1024

    try:
        for i, f in enumerate(files, 1):
            original = f.filename
            name = secure_filename(original)
            ext = ext_of(name) or ext_of(original)
            if ext in BLOCKED or ext_of(original) in BLOCKED:
                raise ValueError(f"{original} can't be sent. Program files (.exe, .msi, .dll) are not allowed.")
            if not name:
                name = f"file-{i}" + (f".{ext}" if ext else "")
            name = unique_name(name, used)
            path = folder / name
            f.save(path)
            size = path.stat().st_size
            total += size
            if total > max_bytes:
                raise ValueError(f"Too big. The limit is {MAX_TOTAL_MB} MB per upload.")
            saved.append({"name": name, "size": size, "ext": ext_of(name), "image": ext_of(name) in IMAGE_EXTS})
    except ValueError as err:
        shutil.rmtree(folder, ignore_errors=True)
        return jsonify(error=str(err)), 400
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise

    with lock:
        transfers[token] = {"files": saved, "expires": time.time() + EXPIRY_MINUTES * 60}

    return jsonify(
        token=token,
        url=f"{public_base()}/d/{token}",
        qr=f"/qr/{token}.svg",
        count=len(saved),
        expires_in=EXPIRY_MINUTES * 60,
    )


@app.get("/qr/<token>.svg")
def qr_code(token):
    if not get_transfer(token):
        abort(404)
    code = segno.make(f"{public_base()}/d/{token}", error="m")
    buf = io.BytesIO()
    code.save(buf, kind="svg", scale=8, border=2, dark="#0b1a3a", light="#ffffff")
    return send_file(io.BytesIO(buf.getvalue()), mimetype="image/svg+xml")


@app.get("/d/<token>/f/<name>")
def get_file(token, name):
    item = get_transfer(token)
    entry = next((f for f in item["files"] if f["name"] == name), None) if item else None
    if not entry:
        abort(404)
    # Only images are shown in the browser; every other file type is always a download.
    as_attachment = request.args.get("dl") == "1" or not entry["image"]
    resp = send_from_directory(UPLOAD_ROOT / token, name, as_attachment=as_attachment)
    resp.headers["Content-Security-Policy"] = "sandbox"
    return resp


@app.get("/d/<token>/zip")
def get_zip(token):
    item = get_transfer(token)
    if not item:
        abort(404)
    buf = io.BytesIO()
    # ZIP_STORED keeps the original bytes untouched.
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as z:
        for f in item["files"]:
            z.write(UPLOAD_ROOT / token / f["name"], f["name"])
    buf.seek(0)
    return send_file(buf, mimetype="application/zip", as_attachment=True,
                     download_name="beamshot-files.zip")


# ---------- start ----------

fresh_start()
threading.Thread(target=janitor, daemon=True).start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n  {APP_NAME}  (any file up to {MAX_TOTAL_MB} MB, script logo)")
    print(f"  Running from: {BASE_DIR}")
    print(f"\n  On this computer:  http://localhost:{port}")
    print(f"  On your network:   http://{lan_ip()}:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
