
# FRISAT - Sistema de Identificación de Régimen de Flujo

FRISAT (Sistema de Identificación de Régimen de Flujo en Tanques Agitados) es una aplicación web de adquisición de datos diseñada para monitorear, registrar y analizar información de múltiples sensores en tiempo real, utilizando un modelo de Machine Learning para identificar el régimen de flujo (laminar, transición o turbulento) en tanques agitados.

## Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Guía de Inicio Rápido](#guía-de-inicio-rápido)
  - [Prerrequisitos](#prerrequisitos)
  - [Instalación](#instalación)
  - [Ejecutando el Entorno de Desarrollo](#ejecutando-el-entorno-de-desarrollo)
- [Estructura de Directorios](#estructura-de-directorios)
- [Flujo de Datos y Lógica de la Aplicación](#flujo-de-datos-y-lógica-de-la-aplicación)
- [Despliegue](#despliegue)

---

## Arquitectura del Sistema

FRISAT se compone de dos partes principales que se comunican entre sí:

1.  **Frontend (Aplicación Web)**:
    *   Construido con **Next.js** y **React**, proporciona la interfaz de usuario para configurar pruebas, visualizar datos en tiempo real y explorar el historial.
    *   Utiliza **TypeScript** para un tipado seguro y robusto.
    *   La interfaz de usuario está construida con componentes de **ShadCN/UI** y estilizada con **Tailwind CSS**.
    *   Gestiona el estado global de la aplicación (configuración, estado de adquisición, datos de sensores) a través de **React Context**.
    *   Se comunica con el backend de Python a través de **WebSockets** para enviar muestras de sensores y recibir predicciones en tiempo real.

2.  **Backend (Servidor de Machine Learning)**:
    *   Construido con **Python** y el framework **FastAPI**.
    *   Expone un endpoint de **WebSocket** (`/ws`) que gestiona la comunicación con el frontend.
    *   Recibe los datos de los sensores, los normaliza y los introduce en un modelo de **Keras/TensorFlow** (`Modelo_1500.h5`) para la predicción.
    *   Devuelve la predicción del régimen de flujo (Laminar, Transición, Turbulento) y las probabilidades asociadas al frontend.

---

## Stack Tecnológico

### Frontend

| Característica | Valor | Notas |
| :--- | :--- | :--- |
| **Framework** | `Next.js 14.2` | Framework de React para producción. |
| **Lenguaje** | `TypeScript` | Superset de JavaScript con tipado estático. |
| **UI Components**| `ShadCN/UI` | Componentes reutilizables y accesibles. |
| **Estilos** | `Tailwind CSS` | Framework CSS "Utility-first". |
| **Estado Global**| `React Context` | Para gestionar el estado de la aplicación. |
| **Gráficas** | `Recharts` | Librería de gráficos para React. |
| **Formularios** | `React Hook Form` | Gestión de formularios con validación. |
| **Validación** | `Zod` | Validación de esquemas para formularios y tipos. |

### Backend

| Característica | Valor | Notas |
| :--- | :--- | :--- |
| **Lenguaje** | `Python 3.x` | |
| **Framework** | `FastAPI` | Framework web de alto rendimiento para APIs. |
| **Servidor** | `Uvicorn` | Servidor ASGI para FastAPI. |
| **ML/IA** | `TensorFlow/Keras` | Para cargar y ejecutar el modelo predictivo. |
| **Cálculo Num.** | `NumPy` | Manipulación de datos de sensores. |
| **Comunicación**| `WebSockets` | Para la comunicación en tiempo real con el frontend. |

### Entorno y Despliegue

| Característica | Valor | Notas |
| :--- | :--- | :--- |
| **Gestor Pkgs** | `npm` | Gestor de paquetes de Node.js. |
| **Versión Node** | `20.x` | Ver `.nvmrc`. |
| **Producto Cloud**| `Firebase App Hosting` | Utilizado para el despliegue de la aplicación Next.js. |
| **Directorio Build**| `.next` | Directorio de salida de la compilación. |

---

## Guía de Inicio Rápido

Siga estas instrucciones para tener el proyecto funcionando en su máquina local.

### Prerrequisitos

- **Node.js**: Versión `20.x` o superior.
- **Python**: Versión `3.8` o superior.
- **npm**: Generalmente se instala junto con Node.js.

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone <repository-url>
    cd frisat-app
    ```

2.  **Instalar dependencias del Frontend:**
    ```bash
    npm install
    ```

3.  **Instalar dependencias del Backend:**
    *El script de inicio (`start-backend`) se encarga de instalar las dependencias de Python automáticamente, pero si desea hacerlo manualmente:*
    ```bash
    pip install -r ml_backend/requirements.txt
    ```

### Ejecutando el Entorno de Desarrollo

Para ejecutar el proyecto, necesita iniciar **dos procesos en terminales separadas**: el backend de Python y el frontend de Next.js.

**Terminal 1: Iniciar el Backend (Python)**

Abra una terminal y ejecute el script de inicio correspondiente a su sistema operativo desde la raíz del proyecto.

- **Para Windows:**
  ```bash
  .\ml_backend\start-backend.bat
  ```

- **Para macOS / Linux:**
  ```bash
  ./ml_backend/start-backend.sh
  ```
  *(Si obtiene un error de "permission denied", ejecute `chmod +x ./ml_backend/start-backend.sh` una vez y vuelva a intentarlo).*

El servidor de Python estará corriendo en `http://127.0.0.1:8765`.

**Terminal 2: Iniciar el Frontend (Next.js)**

Abra una segunda terminal en la raíz del proyecto y ejecute:

```bash
npm run dev
```

Esto iniciará el servidor del frontend en `http://localhost:9003`. Abra esta URL en su navegador para ver la aplicación.

---

## Estructura de Directorios

```
frisat-app/
├── public/                # Archivos estáticos (imágenes, videos, etc.)
├── ml_backend/            # Código fuente del backend de Python
│   ├── server.py          # Lógica del servidor FastAPI y WebSocket
│   ├── Modelo_1500.h5     # Modelo de Machine Learning
│   ├── MaxiMini.npz       # Valores de normalización para el modelo
│   └── requirements.txt   # Dependencias de Python
├── src/
│   ├── app/               # Rutas de la aplicación (App Router de Next.js)
│   │   ├── (main)/        # Layout principal de la aplicación
│   │   │   ├── adquisicion/
│   │   │   ├── configuracion/
│   │   │   ├── historial/
│   │   │   └── ...
│   │   ├── globals.css    # Estilos globales y variables de Tailwind/CSS
│   │   └── layout.tsx     # Layout raíz
│   ├── components/
│   │   ├── ui/            # Componentes base de ShadCN (Button, Card, etc.)
│   │   └── app/           # Componentes específicos de la aplicación (SensorChart, etc.)
│   ├── context/
│   │   └── AppContext.tsx # Contexto global de React para el estado
│   ├── hooks/             # Hooks personalizados (useTranslation, usePredictionWebSocket)
│   ├── lib/
│   │   ├── i18n.ts        # Textos de traducción para internacionalización
│   │   ├── types.ts       # Definiciones de tipos de TypeScript
│   │   └── utils.ts       # Funciones de utilidad
│   └── actions/           # Server Actions de Next.js (ej: para leer/escribir archivos)
├── package.json           # Dependencias y scripts del frontend
└── ...
```

---

## Flujo de Datos y Lógica de la Aplicación

1.  **Configuración**: El usuario define los parámetros de la prueba (tiempo, frecuencia, sensores, nombre de archivo) en la página `/configuracion`.
2.  **Inicio de Adquisición**: Al confirmar, el estado de la aplicación cambia a `ready` y se navega a `/adquisicion`. Al presionar "Iniciar", el estado cambia a `running`.
3.  **Monitoreo en Tiempo Real**:
    *   La página de adquisición genera datos simulados de sensores a la frecuencia especificada.
    *   Se establece una conexión WebSocket con el backend de Python.
    *   Cada nueva muestra de los sensores se envía al backend a través del WebSocket.
    *   El backend procesa las muestras y utiliza el modelo de Keras para predecir el régimen de flujo.
    *   La predicción se envía de vuelta al frontend y se muestra en la `PredictionCard`.
4.  **Finalización y Resumen**:
    *   La adquisición termina cuando se alcanza el tiempo definido o el usuario la detiene. El estado cambia a `completed` o `stopped`.
    *   El sistema guarda automáticamente los resultados en un archivo `.csv` en el directorio `mediciones_guardadas/`.
    *   Se muestra una vista de resumen con estadísticas clave y los gráficos completos.
5.  **Historial**: La página `/historial` lee el directorio `mediciones_guardadas/`, parsea los archivos CSV para mostrar un resumen de todas las pruebas pasadas y permite ver los detalles de cada una.

---

## Despliegue

Este proyecto está configurado para desplegarse en **Firebase App Hosting**. El proceso de despliegue se desencadena automáticamente en cada `push` a la rama principal (`main`).

El archivo `apphosting.yaml` en la raíz del proyecto contiene la configuración de compilación (`npm run build`) y ejecución (`npm start`) para el entorno de App Hosting.
