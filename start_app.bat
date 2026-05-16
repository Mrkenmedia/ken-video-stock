@echo off
title Ken Video Stock Platform - Dev Server
echo ==============================================
echo   STARTING KEN VIDEO PLATFORM DEV SERVER...
echo ==============================================
echo.
echo Please wait a few seconds for the server to compile...

:: Start the Next.js development server in a separate window
start "Next.js Server" cmd /k "npm run dev"

:: Wait 7 seconds to ensure the server has started
timeout /t 7 /nobreak >nul

:: Open the default browser to the app
echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo.
echo App is running! You can close this window now.
pause
