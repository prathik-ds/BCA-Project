@echo off
echo Starting NexusFest Project...

echo Starting PHP Backend Server on port 8000 (accessible on network)...
start cmd /k "cd api && php -S 0.0.0.0:8000"

echo Starting Vite Frontend Server on port 5173 (accessible on network)...
start cmd /k "cd web && npm run dev"

echo Project is starting! 
echo View the command prompt windows for the Network IP addresses.
echo Enjoy NexusFest 2026!
pause
