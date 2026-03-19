@echo off
echo Starting NexusFest Project...

echo Starting PHP Backend Server on port 8000...
start cmd /k "cd api && php -S localhost:8000"

echo Starting Vite Frontend Server on port 5173...
start cmd /k "cd web && npm run dev"

echo Project is starting! 
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo Enjoy NexusFest 2026!
pause
