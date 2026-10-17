@echo off
setlocal
cd /d "%~dp0"
set "CLASSROOM_NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
where node >nul 2>nul
if not errorlevel 1 (
  node node_modules\vite\bin\vite.js --host 127.0.0.1 --port 4180 --strictPort
  goto :done
)
set "CLASSROOM_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%CLASSROOM_NODE%" (
  "%CLASSROOM_NODE%" node_modules\vite\bin\vite.js --host 127.0.0.1 --port 4180 --strictPort
) else (
  echo Node.js is required. Install Node.js and run pnpm install first.
)
:done
pause
