
@echo off
echo Starting FRISAT backend with database initialization...

REM Navigate to the script's directory to ensure paths are correct
cd /d "%~dp0"

echo Finding Python interpreter...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo "Error: Python interpreter not found. Please ensure 'python' is in your PATH."
    exit /b 1
)

echo Starting backend with database initialization...
python start-backend-with-db.py
