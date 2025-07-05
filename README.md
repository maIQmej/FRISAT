# FRISAT - Sistema de Identificación de Régimen de Flujo

This is a NextJS starter app for monitoring sensor data and predicting flow regimes.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

## Python Integration Setup

This application uses a Python script to perform real-time predictions. To make it work, you need to configure your local environment correctly.

### 1. Python and Dependencies

Make sure you have Python installed on your system. The prediction script (`src/python/Evaluacion.py`) requires specific libraries to function.

You can install them using pip:
`pip install tensorflow keras numpy`

### 2. Configure Executable Path

The application needs to know the exact path to your Python executable.

1.  Open the `.env` file in the root of the project.
2.  Add a line like this, replacing the path with the actual path to your `python.exe` (for Windows) or `python3` (for macOS/Linux).

    **Windows Example:**
    ```
    PYTHON_EXECUTABLE=C:\\Users\\YourUser\\AppData\\Local\\Programs\\Python\\Python39\\python.exe
    ```
    *(Note the required double backslashes)*

    **macOS/Linux Example:**
    ```
    PYTHON_EXECUTABLE=/usr/bin/python3
    ```

Once these steps are completed, the application should be able to communicate with your Python model.
