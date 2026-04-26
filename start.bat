@echo off
title FairScan - AI Bias Auditor

echo =========================================
echo       FairScan Development Server
echo =========================================
echo.

if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
)

echo.
echo Select how you want to run the project:
echo 1. Standard Frontend (Vite) - Faster start. Note: The "Email Report" feature won't work.
echo 2. Full Stack (Vercel CLI)  - Needed if you want to test the "Email Report" feature locally.
echo.

set /p choice="Enter your choice (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo.
    echo [INFO] Starting with Vercel CLI...
    echo [INFO] Note: If you don't have Vercel installed globally, this might fail.
    echo [INFO] You can install it via 'npm i -g vercel'.
    call npx vercel dev
) else (
    echo.
    echo [INFO] Starting with Vite (Frontend only)...
    call npm run dev
)

pause
