@echo off
title Stop CarLight Frontend
echo Stopping anything on port 3000...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
echo Port 3000 closed.
timeout /t 2 >nul
