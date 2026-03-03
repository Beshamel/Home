@echo off
setlocal

net session >nul 2>&1
if %errorlevel% neq 0 (
	echo Requesting administrator privileges...
	powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs -WorkingDirectory '%~dp0'"
	exit /b
)

cd /d "%~dp0"

echo Fetching and installing updates...

git pull

cd home
call npm i --legacy-peer-deps
call npm run build
nssm restart home
cd ..

cd backend
"%~dp0.venv\Scripts\python.exe" -m alembic upgrade head
"%~dp0.venv\Scripts\python.exe" -m pip install -r requirements.txt
nssm stop home-app
nssm start home-app

echo Update complete!
pause