@echo off
setlocal
set PORT=4260
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%PORT%%" ^| findstr "LISTENING"') do (
  echo Stopping preview process %%a on port %PORT%
  taskkill /PID %%a /F
)
echo Done.
