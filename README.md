# FRISAT - Sistema de Identificación de Régimen de Flujo

FRISAT es un sistema avanzado de adquisición de datos diseñado para monitorear, registrar y analizar información de múltiples sensores en tiempo real en tanques agitados.

## Getting Started

Siga estas instrucciones para tener una copia del proyecto funcionando en su máquina local para propósitos de desarrollo y pruebas.

### Prerrequisitos

- **Node.js**: Necesitará tener instalado [Node.js](https://nodejs.org/) en su sistema.
- **Python**: Necesitará [Python](https://www.python.org/downloads/) para ejecutar el backend de Machine Learning.

### Instalación

1. Clone el repositorio e instale las dependencias de Node.js:
   ```bash
   git clone <repository-url>
   cd frisat-app
   npm install
   ```

2. Instale las dependencias de Python:
    ```bash
    # Navegue a la carpeta del backend
    cd ml_backend

    # Instale los paquetes de Python
    pip install -r requirements.txt
    ```
    *(Nota: dependiendo de su sistema, puede que necesite usar `python -m pip` o `python3 -m pip`)*

### Ejecutando el Servidor de Desarrollo

Para ejecutar el proyecto completo, necesita iniciar dos procesos en terminales separadas: el **backend de Python** y el **frontend de Next.js**.

**1. Iniciar el Backend (Python)**

Abra una terminal y ejecute el script de inicio correspondiente a su sistema operativo.

- **Para Windows:**
  ```bash
  # Desde la raíz del proyecto
  .\ml_backend\start-backend.bat
  ```

- **Para macOS / Linux:**
  ```bash
  # Desde la raíz del proyecto
  ./ml_backend/start-backend.sh
  ```
  *(Si obtiene un error de "permission denied" en Mac/Linux, ejecute `chmod +x ./ml_backend/start-backend.sh` una vez y vuelva a intentarlo).*

El servidor de Python estará corriendo en `http://127.0.0.1:8765`.

**2. Iniciar el Frontend (Next.js)**

Abra una **segunda terminal** y ejecute:

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo del frontend en `http://localhost:9003`. Puede abrir esta URL en su navegador para ver la aplicación.

## Despliegue

Este proyecto está configurado para desplegarse en **Firebase App Hosting**. El despliegue se gestiona a través de commits a la rama principal configurada en la consola de Firebase.

El archivo `apphosting.yaml` en la raíz del proyecto define la configuración de compilación y ejecución para el entorno de App Hosting.

El proceso de despliegue se desencadena automáticamente en cada `push` a la rama `main` (o la rama que se haya configurado para el despliegue continuo).