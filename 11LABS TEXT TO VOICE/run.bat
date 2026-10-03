@echo off
title ElevenLabs Voice Studio
echo Starting ElevenLabs Voice Studio...
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not detected in your PATH. Please make sure Python is installed.
    pause
    exit /b 1
)

:: Install requirements if needed
echo Checking dependencies...
python -m pip install -q -r requirements.txt

:: Open default browser to localhost
start http://127.0.0.1:5000

:: Start the Flask app
echo Server running at http://127.0.0.1:5000
echo Press Ctrl+C to stop the server.
python app.py
pause
