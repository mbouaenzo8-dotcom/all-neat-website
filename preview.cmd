@echo off
rem Sert la version compilee (dist/) comme en production : utile pour Lighthouse et les tests finaux.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if "%PORT%"=="" set "PORT=4173"
call "C:\Program Files\nodejs\npm.cmd" run preview -- --port %PORT% --strictPort
