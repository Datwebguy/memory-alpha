@echo off
setlocal
cd /d "%~dp0"
set PORT=4260
echo MemoryAlpha preview
echo URL: http://127.0.0.1:%PORT%/index.html
echo.
echo Keep this window open while previewing.
echo Press Ctrl+C to stop.
node memoryalpha.cjs
