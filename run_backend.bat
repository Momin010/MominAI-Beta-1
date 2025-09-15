@echo off
setlocal

REM Set Node.js path
set NODE_PATH=%~dp0node-v22.18.0-win-x64
set PATH=%NODE_PATH%;%PATH%

echo Starting Docker Multi-User IDE Backend Server...
echo Mode: Local Development (No Docker)
echo.

cd server
"%NODE_PATH%\node.exe" index.js

pause