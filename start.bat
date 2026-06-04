@echo off
cd /d "%~dp0frontend"
echo Starting FastPOS at http://localhost:3000
echo Open this link in Chrome or Edge. Works offline after first load.
npx --yes serve . -l 3000
