#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Navigate to the script's directory to ensure paths are correct
cd "$(dirname "$0")"

echo "Finding Python interpreter..."
# Find a python interpreter, preferring python3 if available
if command -v python3 &> /dev/null
then
    PYTHON_CMD=python3
elif command -v python &> /dev/null
then
    PYTHON_CMD=python
else
    echo "Error: Python interpreter not found."
    exit 1
fi

echo "Using $($PYTHON_CMD --version)"

echo "Installing/updating Python dependencies from requirements.txt..."
$PYTHON_CMD -m pip install -r requirements.txt

echo "Starting Uvicorn server for FastAPI..."
$PYTHON_CMD -m uvicorn server:app --host 127.0.0.1 --port 8765 --reload
