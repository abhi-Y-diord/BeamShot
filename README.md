# Beamshot

Send any file (images, PDFs, code, ZIPs) up to 50 MB from one computer to your phone. Upload, scan the QR code, download. Files stay exactly as they are.

## Run it (Windows)

Double-click run.bat. It sets everything up, starts the server and opens the page.

Or by hand:

    python -m venv venv
    venv\Scripts\activate
    python -m pip install -r requirements.txt
    python app.py

Open http://localhost:5000. The phone must be on the same Wi-Fi. If the phone cannot open
the link, allow Python through Windows Firewall when prompted.

## Settings (top of app.py)

- APP_NAME, MAX_TOTAL_MB = 50, EXPIRY_MINUTES = 30
- Set the PUBLIC_URL environment variable to your site address when you host it online.
