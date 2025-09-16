
@echo off
echo Attempting to start the Python backend for Windows...

REM Navigate to the script's directory to ensure paths are correct
cd /d "%~dp0"

echo Finding Python interpreter...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo "Error: Python interpreter not found. Please ensure 'python' is in your PATH."
    exit /b 1
)

echo Installing/updating Python dependencies from requirements.txt...
python -m pip install -r requirements.txt

echo Starting Uvicorn server for FastAPI...
python -m uvicorn server:app --host 127.0.0.1 --port 8765 --reload
