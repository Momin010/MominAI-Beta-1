@echo off
setlocal

REM Set Node.js path
set NODE_PATH=%~dp0node-v22.18.0-win-x64
set PATH=%NODE_PATH%;%PATH%

echo Installing backend dependencies...
cd server
"%NODE_PATH%\npm.cmd" install

echo Installing frontend dependencies...
cd ..
"%NODE_PATH%\npm.cmd" install

echo Installing IDE-specific dependencies...
cd src/IDE
"%NODE_PATH%\npm.cmd" install

echo Dependencies installed successfully!
pause