#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# This script is the recommended way to start the Python backend manually.
# Run this script from the project root directory: ./ml_backend/start-backend.sh

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
    echo "Error: Python interpreter not found. Please ensure 'python' or 'python3' is in your PATH."
    exit 1
fi

echo "Using $($PYTHON_CMD --version)"

echo "Installing/updating Python dependencies from requirements.txt..."
$PYTHON_CMD -m pip install -r requirements.txt

echo "Starting Uvicorn server for FastAPI..."
# Use exec to replace the script process with the uvicorn process
exec $PYTHON_CMD -m uvicorn server:app --host 127.0.0.1 --port 8765 --reload
