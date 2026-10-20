@echo off
cd /d "%~dp0"
echo Starting Beamshot...
if not exist venv ( python -m venv venv )
call venv\Scripts\activate
python -m pip install -q -r requirements.txt
start "" http://localhost:5000
python app.py
pause
