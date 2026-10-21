<div align="center">

# 🚀 Beamshot

### Send any file from one device to your phone. Upload, scan, download.

No login. No WhatsApp Web. No quality loss.

<br>

[![Open Live Site](https://img.shields.io/badge/Open_Live_Site-Launch_Beamshot-2563eb?style=for-the-badge&logo=rocket&logoColor=white)](https://beamshot-5d8ef.containers.snapdeploy.app)

<br>

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![Max size](https://img.shields.io/badge/Max_upload-50_MB-2563eb?style=flat-square)
![Auto delete](https://img.shields.io/badge/Auto_delete-30_min-0ea5e9?style=flat-square)
![Hosting](https://img.shields.io/badge/Hosted_on-SnapDeploy-1e293b?style=flat-square)

</div>

<!-- To add a preview image: save a screenshot as docs/screenshot.png and uncomment the line below.
<p align="center"><img src="docs/screenshot.png" alt="Beamshot screenshot" width="720"></p>
-->

---

## ✨ What is Beamshot?

Beamshot moves files from a computer to a phone in three steps. It was built for college lab PCs, where logging in to WhatsApp Web just to move a few screenshots is a hassle (and easy to forget to log out of).

1. **Upload** your files on any computer.
2. **Scan** the QR code with your phone.
3. **Download** everything, exactly as it was.

Files are stored untouched, with no resizing and no re-encoding, so a screenshot arrives in its original quality.

<div align="center">

[![Try it now](https://img.shields.io/badge/Try_it_now-beamshot--5d8ef.containers.snapdeploy.app-2563eb?style=for-the-badge)](https://beamshot-5d8ef.containers.snapdeploy.app)

</div>

---

## 🎯 Features

| | Feature | Details |
|---|---|---|
| 📁 | **Any file type** | Images, PDFs, code, ZIPs and more |
| 📦 | **Up to 50 MB** | Total size per transfer, up to 30 files at once |
| 📱 | **QR code transfer** | Scan with your phone's camera to open the download page |
| 🖼️ | **Original quality** | Files are never compressed or converted |
| ⏳ | **Auto-delete** | Every transfer is wiped after 30 minutes |
| 🗜️ | **Download all as ZIP** | One tap to grab everything |
| 🔐 | **No account needed** | Nothing to sign up for or log out of |
| 🛡️ | **Safe by default** | Program files (`.exe`, `.msi`, `.dll` and similar) are blocked |
| 🌗 | **Light and dark mode** | Glass-style interface, mobile friendly |
| 🚀 | **Smooth animations** | Folder-open and rocket-launch effects |

---

## 🧠 How it works

```
 Computer                  Beamshot server                 Phone
 ────────                  ───────────────                 ─────
 Choose files  ─────────►  Saves files, makes a
                           secret link + QR code
 Shows QR code ◄─────────  
                                                  ◄─────── Scans QR code
                           Download page  ──────────────►  Downloads files
                           Deletes everything after 30 min
```

Each transfer gets its own random link, so only someone with the QR code or link can open it.

---

## 🛠️ Tech stack

| Layer | Tools |
|---|---|
| Backend | Python, Flask |
| QR codes | segno (generated as SVG) |
| Frontend | HTML, CSS, JavaScript with a glassmorphism UI |
| Production server | Gunicorn |
| Packaging | Docker |
| Hosting | SnapDeploy (free tier) |

---

## 💻 Run it locally (Windows)

Double-click **`run.bat`**. It sets everything up, starts the server and opens the page.

Or do it by hand:

```bash
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
python app.py
```

Open <http://localhost:5000>. Your phone must be on the same Wi-Fi to scan the QR code. If the phone can't open the link, allow Python through Windows Firewall when prompted.

---

## ⚙️ Settings

Edit these at the top of `app.py`:

| Setting | Default | What it does |
|---|---|---|
| `APP_NAME` | `Beamshot` | Name shown on the site |
| `MAX_TOTAL_MB` | `50` | Total upload size per transfer |
| `MAX_FILES` | `30` | Files allowed per transfer |
| `EXPIRY_MINUTES` | `30` | How long files stay before deletion |

Environment variables:

| Variable | Purpose |
|---|---|
| `PUBLIC_URL` | Your site's public address (for example `https://your-site.com`). Set this when hosting online so QR codes use the right link. |
| `PORT` | Port to listen on (default `5000`) |

---

## 🌐 Deploying online

The repo includes a `Dockerfile`, so it deploys on any container host. The live site runs on SnapDeploy's free tier.

```bash
docker build -t beamshot .
docker run -p 5000:5000 -e PUBLIC_URL=http://localhost:5000 beamshot
```

> **Keep it to one worker.** Beamshot tracks active transfers in memory, so the server must run a single Gunicorn worker (the Dockerfile already does this).

### Good to know about free hosting

- The site **sleeps after about 15 minutes** without visitors. The first visit afterwards takes around a minute to wake it.
- Files live on temporary storage and are deleted after 30 minutes, or sooner if the server restarts.
- Upload speed depends mostly on your own network connection.

---

## 📂 Project structure

```
BeamShot/
├── app.py              # Flask app: uploads, QR codes, downloads
├── requirements.txt    # Python dependencies
├── Dockerfile          # Container build for hosting
├── templates/          # Upload, download and expired pages
├── static/             # CSS, JavaScript, images, fonts
└── README.md
```

---

## 🔒 Privacy

- Files are kept only for the time limit (30 minutes by default), then deleted automatically.
- Each transfer uses a random link that is hard to guess.
- Beamshot has no accounts, no tracking and no database.

---

<div align="center">

### Ready to beam a file?

[![Open Live Site](https://img.shields.io/badge/Open_Live_Site-Launch_Beamshot-2563eb?style=for-the-badge&logo=rocket&logoColor=white)](https://beamshot-5d8ef.containers.snapdeploy.app)

<br>

Made by [abhi-Y-diord](https://github.com/abhi-Y-diord)

</div>
