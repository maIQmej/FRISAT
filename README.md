# FRISAT - Sistema de Identificación de Régimen de Flujo

FRISAT es un sistema avanzado de adquisición de datos diseñado para monitorear, registrar y analizar información de múltiples sensores en tiempo real en tanques agitados.

## Getting Started

Siga estas instrucciones para tener una copia del proyecto funcionando en su máquina local para propósitos de desarrollo y pruebas.

### Prerrequisitos

Necesitará tener instalado [Node.js](https://nodejs.org/) en su sistema. Se recomienda utilizar la versión especificada en el archivo `.nvmrc`.

Si utiliza `nvm` (Node Version Manager), puede ejecutar el siguiente comando en la raíz del proyecto para usar la versión correcta:

```bash
nvm use
```

### Instalación

1. Clone el repositorio en su máquina local:
   ```bash
   git clone <repository-url>
   ```
2. Navegue al directorio del proyecto:
   ```bash
   cd frisat-app
   ```
3. Instale las dependencias del proyecto utilizando `npm`:
   ```bash
   npm ci
   ```
   Se recomienda usar `npm ci` para asegurar una instalación limpia y consistente que coincida con `package-lock.json`.

### Ejecutando el Servidor de Desarrollo

Para iniciar la aplicación en modo de desarrollo, ejecute el siguiente comando:

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo en `http://localhost:9002`. Puede abrir esta URL en su navegador para ver la aplicación en funcionamiento. La aplicación se recargará automáticamente si realiza cambios en el código.

## Despliegue

Este proyecto está configurado para desplegarse en **Firebase App Hosting**. El despliegue se gestiona a través de commits a la rama principal configurada en la consola de Firebase.

El archivo `apphosting.yaml` en la raíz del proyecto define la configuración de compilación y ejecución para el entorno de App Hosting.

El proceso de despliegue se desencadena automáticamente en cada `push` a la rama `main` (o la rama que se haya configurado para el despliegue continuo).

## Scripts Disponibles

En el directorio del proyecto, puede ejecutar:

- `npm run dev`: Inicia la aplicación en modo de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia un servidor de producción.
- `npm run lint`: Ejecuta ESLint para analizar el código en busca de problemas.
- `npm run typecheck`: Ejecuta el compilador de TypeScript para verificar los tipos sin emitir archivos.
