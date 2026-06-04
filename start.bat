@echo off
cd /d "%~dp0frontend"
echo.
echo  FastPOS is starting...
echo  Open:  http://localhost:3000
echo  Pages: http://localhost:3000/products.html
echo         http://localhost:3000/dashboard.html
echo.
npx --yes serve . -l 3000
