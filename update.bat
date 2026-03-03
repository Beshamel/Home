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

echo Restarting home-app service...
nssm stop home-app >nul 2>&1

set STOP_WAIT=0
:wait_home_app_stopped
sc query home-app | findstr /I "STATE" | findstr /I "STOPPED" >nul
if %errorlevel%==0 goto start_home_app
set /a STOP_WAIT+=1
if %STOP_WAIT% GEQ 60 (
	echo Timed out waiting for home-app to stop.
	exit /b 1
)
timeout /t 1 /nobreak >nul
goto wait_home_app_stopped

:start_home_app
nssm start home-app
if %errorlevel% neq 0 (
	echo Failed to start home-app.
	exit /b 1
)

echo Update complete!
pause