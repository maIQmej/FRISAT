#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# This script is no longer the primary way to start the backend.
# Use 'npm run dev' from the root directory instead.

echo "This script is for manual execution only."
echo "The recommended way to start the servers is by running 'npm run dev' from the project root."
echo ""
echo "Attempting to start the Python backend..."

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
