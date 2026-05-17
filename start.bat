@echo off
echo Iniciando CRM WhatsApp...

start "Backend" cmd /k "cd /d C:\WORK\CRM && go run ./cmd/api"
timeout /t 3 /nobreak > nul
start "Frontend" cmd /k "cd /d C:\WORK\CRM\frontend && npm run dev"
timeout /t 3 /nobreak > nul
start "Ngrok Backend" cmd /k "ngrok http 8080"
timeout /t 5 /nobreak > nul
start "" "http://localhost:5173"

echo.
echo Pronto!
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo Ngrok:    veja a janela do ngrok para o link publico
pause