# 🚀 Guía Rápida de Convenciones

## Instalación Inicial
Las herramientas ya están configuradas, pero asegúrate de que los hooks estén activos:

```bash
npm install
npx husky install
```

## 📝 Hacer un Commit

### Opción 1: Usar Commitizen (Recomendado)
```bash
git add .
npm run commit
```
Esto abrirá un wizard interactivo que te guiará para crear el commit perfecto.

### Opción 2: Commit Manual
```bash
git commit -m "feat(tasks): add drag and drop functionality"
```

## 🌿 Crear una Rama

### Para Features
```bash
git checkout -b feature/TM-001-task-creation
```

### Para Bug Fixes
```bash
git checkout -b bugfix/TM-002-timer-not-stopping
```

### Para Hotfixes
```bash
git checkout -b hotfix/TM-003-critical-data-loss
```

## ✅ Validar Convenciones

### Validar nombre de rama actual
```bash
npm run validate:branch
```

### Validar último commit
```bash
npm run validate:commit
```

## 🏷️ Crear Releases

### Patch (1.0.0 -> 1.0.1)
```bash
npm run release:patch
```

### Minor (1.0.0 -> 1.1.0)
```bash
npm run release:minor
```

### Major (1.0.0 -> 2.0.0)
```bash
npm run release:major
```

## 🔧 Scripts Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run commit` | Commit interactivo con Commitizen |
| `npm run validate:branch` | Validar nombre de rama |
| `npm run validate:commit` | Validar último commit |
| `npm test` | Ejecutar tests |
| `npm run build` | Construir proyecto |
| `npm run lint` | Revisar código |

## ❌ Qué NO hacer

### ❌ Commits inválidos:
```bash
git commit -m "fix stuff"           # Muy vago
git commit -m "Fix: bug"            # Primera letra mayúscula
git commit -m "feat: add feature."  # Termina con punto
git commit -m "update"              # Sin tipo
```

### ❌ Nombres de rama inválidos:
```bash
feature/add_task        # snake_case
bugfix/123             # Sin descripción
fix-timer              # Sin prefijo
feature/TM-001-Task    # CamelCase
```

## ✅ Ejemplos Correctos

### ✅ Commits válidos:
```bash
feat(tasks): add drag and drop functionality
fix(timer): resolve timer not stopping on task completion
docs(readme): update installation instructions
test(hooks): add comprehensive tests for useTasks hook
```

### ✅ Nombres de rama válidos:
```bash
feature/TM-001-task-creation
bugfix/TM-002-timer-not-stopping
hotfix/TM-003-critical-data-loss
docs/TM-004-api-documentation
```

## 🚨 Validaciones Automáticas

El proyecto tiene configuradas validaciones automáticas que se ejecutan:

- **Pre-commit**: Ejecuta tests y build antes de cada commit
- **Commit-msg**: Valida que el mensaje de commit siga las convenciones
- **Branch naming**: Puedes validar manualmente con `npm run validate:branch`

Si alguna validación falla, el commit será rechazado y verás un mensaje de error explicativo.

## 📚 Documentación Completa

Para más detalles, consulta [CONVENTIONS.md](./CONVENTIONS.md)
