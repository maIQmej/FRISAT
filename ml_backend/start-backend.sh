#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# This script is the recommended way to start the Python backend with database initialization.
# Run this script from the project root directory: ./ml_backend/start-backend.sh

echo "Starting FRISAT backend with database initialization..."

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

echo "Starting backend with database initialization..."
# Use exec to replace the script process with the uvicorn process
exec $PYTHON_CMD start-backend-with-db.py
