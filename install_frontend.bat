@echo off
setlocal

REM Set Node.js path
set NODE_PATH=%~dp0node-v22.18.0-win-x64
set PATH=%NODE_PATH%;%PATH%

echo Installing frontend dependencies...
cd src/IDE
"%NODE_PATH%\npm.cmd" install
cd ..

echo Frontend dependencies installed successfully!
pause