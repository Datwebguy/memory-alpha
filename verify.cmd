@echo off
setlocal
cd /d "%~dp0"
set PORT=4260
node verify.cjs
