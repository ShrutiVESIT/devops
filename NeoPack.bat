@echo off
setlocal

set "ROOT=D:\Computer Science\projects\GHub_Contributions\devops_mca_toolkit\devops"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "VENV=%BACKEND%\.venv"

if exist "%VENV%\Scripts\python.exe" (
	set "PYTHON_EXE=%VENV%\Scripts\python.exe"
) else (
	set "PYTHON_EXE=python"
)

start "Backend" cmd /k "cd /d "%BACKEND%" && "%PYTHON_EXE%" -m uvicorn index:app --reload"
start "Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"

endlocal
exit
