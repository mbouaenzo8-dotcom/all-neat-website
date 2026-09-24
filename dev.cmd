@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if "%PORT%"=="" set "PORT=5173"
call "C:\Program Files\nodejs\npm.cmd" run dev -- --port %PORT% --strictPort
