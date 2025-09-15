@echo off
setlocal

REM Set Node.js path
set NODE_PATH=%~dp0node-v22.18.0-win-x64
set PATH=%NODE_PATH%;%PATH%

echo Starting Docker Multi-User IDE Frontend...
echo Mode: Development Server
echo.

if not exist node_modules (
    echo Installing dependencies...
    "%NODE_PATH%\npm.cmd" install
)

"%NODE_PATH%\npm.cmd" run dev

pause