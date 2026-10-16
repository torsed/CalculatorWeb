@echo off
chcp 65001 >nul
REM Локальный сервер CalculatorWeb для разработки и проверки в браузере.
REM Нужен потому, что service worker и загрузка модулей требуют http://,
REM а не file://. Свой статик-сервер надёжнее npx serve под Windows-шеллом.
cd /d "%~dp0"
echo Serving CalculatorWeb on http://localhost:8787
echo Ctrl+C to stop.
node tests\static-server.js
pause