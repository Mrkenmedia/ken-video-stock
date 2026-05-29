@echo off
title Ken Video Stock Platform - Dev Server
echo ==============================================
echo   DANG KHOI DONG SERVER...
echo ==============================================
echo.
echo Vui long doi vai giay...

:: Start the Next.js development server in a separate window
start "Next.js Server" cmd /k "npm run dev"

:: Wait 7 seconds to ensure the server has started
timeout /t 7 /nobreak >nul

:: Open the default browser to the app
echo Dang mo trinh duyet tai http://localhost:3000...
start http://localhost:3000

echo.
echo App da duoc mo! Ban co the dong cua so nay.
pause
