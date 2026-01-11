# Convenciones de Desarrollo - Task Manager
## Table of Contents

- [Convenciones de Desarrollo - Task Manager](#convenciones-de-desarrollo-task-manager)
  - [📋 Convenciones de Commits](#convenciones-de-commits)
  - [🌿 Convenciones de Ramas](#convenciones-de-ramas)
  - [🏷️ Convenciones de Versionado](#convenciones-de-versionado)
  - [📝 Convenciones de Pull Requests](#convenciones-de-pull-requests)
  - [📋 Descripción](#descripci-n)
  - [🎯 Tipo de Cambio](#tipo-de-cambio)
  - [🧪 Pruebas](#pruebas)
  - [📝 Checklist](#checklist)
  - [🔧 Configuración de Herramientas](#configuraci-n-de-herramientas)
  - [📚 Recursos Adicionales](#recursos-adicionales)

## 📋 Convenciones de Commits

### Formato de Commits
Utilizamos **Conventional Commits** con el siguiente formato:

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie(s) opcional(es)]
```

### Tipos de Commits

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(auth): add user login system` |
| `fix` | Corrección de errores | `fix(tasks): resolve duplicate task creation` |
| `docs` | Documentación | `docs(readme): update installation instructions` |
| `style` | Cambios de formato (no afectan la lógica) | `style(header): improve button spacing` |
| `refactor` | Refactorización de código | `refactor(utils): simplify task validation logic` |
| `test` | Agregar o modificar tests | `test(tasks): add unit tests for task creation` |
| `chore` | Mantenimiento, dependencias | `chore(deps): update react to v18.2.0` |
| `perf` | Mejoras de rendimiento | `perf(list): optimize task rendering` |
| `ci` | Configuración de CI/CD | `ci(github): add automated testing workflow` |
| `build` | Sistema de build | `build(webpack): update build configuration` |
| `revert` | Revertir commits | `revert: feat(auth): add user login system` |

### Ámbitos Sugeridos
- `auth` - Autenticación y autorización
- `tasks` - Gestión de tareas
- `ui` - Interfaz de usuario
- `api` - Llamadas y lógica de API
- `db` - Base de datos
- `config` - Configuración
- `tests` - Sistema de testing
- `docs` - Documentación

### Reglas para Mensajes de Commit

#### ✅ Hacer:
- Usar imperativo presente: "add" no "added" o "adds"
- Primera letra en minúscula
- No terminar con punto
- Ser descriptivo pero conciso (máximo 72 caracteres en el título)
- Usar inglés para consistencia

#### ❌ No hacer:
- Mensajes vagos: "fix stuff", "update code"
- Commits muy grandes (hacer commits atómicos)
- Mezclar diferentes tipos de cambios

### Ejemplos de Buenos Commits

```bash
feat(tasks): add drag and drop functionality
fix(timer): resolve timer not stopping on task completion
docs(api): add JSDoc comments to task utilities
test(hooks): add comprehensive tests for useTasks hook
refactor(components): extract reusable task form component
chore(deps): update testing dependencies
```

## 🌿 Convenciones de Ramas

### Estructura de Ramas

```
main
├── develop
├── feature/TM-001-task-creation
├── feature/TM-002-user-authentication
├── bugfix/TM-003-timer-not-stopping
├── hotfix/TM-004-critical-data-loss
├── release/v1.2.0
└── docs/TM-005-update-readme
```

### Tipos de Ramas

| Tipo | Propósito | Formato | Ejemplo |
|------|-----------|---------|---------|
| `main` | Código en producción | `main` | `main` |
| `develop` | Integración de desarrollo | `develop` | `develop` |
| `feature` | Nuevas funcionalidades | `feature/TM-XXX-descripcion-corta` | `feature/TM-001-task-timer` |
| `bugfix` | Corrección de errores | `bugfix/TM-XXX-descripcion-corta` | `bugfix/TM-002-login-error` |
| `hotfix` | Correcciones críticas | `hotfix/TM-XXX-descripcion-corta` | `hotfix/TM-003-data-corruption` |
| `release` | Preparación de releases | `release/vX.Y.Z` | `release/v1.2.0` |
| `docs` | Solo documentación | `docs/TM-XXX-descripcion-corta` | `docs/TM-004-api-documentation` |

### Reglas para Nombres de Ramas

#### ✅ Hacer:
- Usar kebab-case (guiones)
- Incluir número de ticket/issue cuando aplique
- Ser descriptivo pero conciso
- Usar inglés
- Prefijo con tipo de rama

#### ❌ No hacer:
- Espacios o caracteres especiales
- Nombres muy largos (máximo 50 caracteres)
- CamelCase o snake_case
- Nombres vagos como "fix" o "update"

## 🏷️ Convenciones de Versionado

Utilizamos **Semantic Versioning (SemVer)**:

```
MAJOR.MINOR.PATCH (ejemplo: 1.4.2)
```

- **MAJOR**: Cambios que rompen compatibilidad
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de errores compatibles

### Ejemplos:
- `1.0.0` - Release inicial
- `1.1.0` - Nueva funcionalidad (drag & drop)
- `1.1.1` - Corrección de error en drag & drop
- `2.0.0` - Cambio mayor (nueva arquitectura)

## 📝 Convenciones de Pull Requests

### Título del PR
```
[TM-XXX] Tipo: Descripción concisa
```

**Ejemplos:**
- `[TM-001] Feature: Add task creation with time tracking`
- `[TM-002] Fix: Resolve timer synchronization issues`
- `[TM-003] Docs: Update API documentation`

### Template de PR
```markdown
## 📋 Descripción
Breve descripción de los cambios realizados.

## 🎯 Tipo de Cambio
- [ ] Bug fix (corrección que soluciona un problema)
- [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] Breaking change (corrección o funcionalidad que causa que funcionalidad existente no funcione como se esperaba)
- [ ] Esta cambio requiere actualización de documentación

## 🧪 Pruebas
- [ ] Tests unitarios agregados/actualizados
- [ ] Tests de integración agregados/actualizados
- [ ] Todas las pruebas pasan localmente

## 📝 Checklist
- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código en áreas difíciles de entender
- [ ] He actualizado la documentación correspondiente
- [ ] Mis cambios no generan nuevas advertencias
```

## 🔧 Configuración de Herramientas

### Commitizen
Para ayudar con el formato de commits:
```bash
npm install -g commitizen cz-conventional-changelog
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc
```

### Husky + Commitlint
Para validar commits automáticamente:
```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
```

## 📚 Recursos Adicionales

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

**Nota**: Estas convenciones son obligatorias para todos los contributors del proyecto Task Manager.
