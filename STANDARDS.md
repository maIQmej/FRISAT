Este documento describe los estándares y convenciones utilizados en este repositorio.

## Stack de Desarrollo

| Característica | Valor                               | Notas                                            |
| :--------------- | :---------------------------------- | :----------------------------------------------- |
| **Framework**    | `Next.js 14.2.4`                    | React Framework para producción.                 |
| **Lenguaje**     | `TypeScript`                        | Superset de JavaScript con tipado estático.      |
| **Gestor Pkgs**  | `npm`                               | Gestor de paquetes de Node.js.                   |
| **Versión Node** | `20.x`                              | Ver `.nvmrc`.                                    |
| **Directorio Build** | `.next`                             | Directorio de salida de la compilación de Next.js. |

## Firebase

| Característica      | Valor            | Notas                               |
| :------------------ | :--------------- | :---------------------------------- |
| **Productos**       | `App Hosting`    | Utilizado para el despliegue.       |
| **Uso de Functions**| `no`             |                                     |
| **Región Functions**| `N/A`            |                                     |
| **Uso de Emulators**| `no`             |                                     |

## Entornos

| Característica    | Valor         |
| :---------------- | :------------ |
| **Proyecto DEV**  | `Por definir` |
| **Proyecto SIT**  | `Por definir` |
| **Proyecto PROD** | `Por definir` |

## Estándares de Código

| Característica         | Valor                                 | Notas                                                                                                                                                             |
| :----------------------- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ESLint + Prettier**  | `custom(ver .eslintrc.json)`          | Para ejecutar el linter, utilice `npm run lint`.                                                                                                                  |
| **Husky + lint-staged**| `no`                                  |                                                                                                                                                                   |
| **Imports Absolutos**  | `yes (configurado en tsconfig.json)` | Los imports absolutos están configurados para evitar rutas relativas complejas como `../../`. Puede importar módulos desde la raíz del directorio `src` usando `@/`. <br/><br/> **Ejemplo:** <br/>`import { Button } from '@/components/ui/button';` |

## Convenciones del Repositorio

| Característica         | Valor         | Notas                                          |
| :----------------------- | :------------ | :--------------------------------------------- |
| **Branching**          | `Por definir` | Se recomienda GitFlow (`main`, `develop`, `feature/...`). |
| **Conventional Commits** | `no`          |                                                |
| **CODEOWNERS**         | `no`          |                                                |
| **Licencia**           | `private`     |                                                |

## Testing

| Característica     | Valor      |
| :----------------- | :--------- |
| **Unit Runner**    | `none`     |
| **E2E**            | `none`     |
| **Coverage Min**   | `N/A`      |

## Documentación y Plantillas

| Característica           | Valor  |
| :----------------------- | :----- |
| **PR Template**          | `no`   |
| **Issue Template**       | `no`   |
| **Architecture Docs**    | `no`   |
| **Cursor Generate Tests/Docs** | `no`   |
