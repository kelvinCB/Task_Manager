# Task Manager - Guía de Testing

Esta guía documenta el enfoque de testing para la aplicación Task Manager, incluyendo pruebas unitarias, E2E y mejores prácticas.

## Índice

1. [Resumen General](#resumen-general)
2. [Pruebas Unitarias](#pruebas-unitarias)
3. [Pruebas E2E (End-to-End)](#pruebas-e2e-end-to-end)
4. [Cómo ejecutar las pruebas](#cómo-ejecutar-las-pruebas)
5. [Bugs corregidos](#bugs-corregidos)
6. [Contribución](#contribución)

## Resumen General

### Estado Actual
✅ **99 pruebas unitarias** (100% pasando)  
✅ **44 pruebas E2E** (100% pasando)  
✅ **Cobertura completa** de funcionalidades críticas  
✅ **Compatible globalmente** (todas las zonas horarias)

### Tecnologías
- **Unitarias**: Vitest + React Testing Library + jsdom
- **E2E**: Playwright + Chromium
- **Enfoque**: Testing centrado en el usuario, accesible y robusto

## Pruebas Unitarias

### Estructura de archivos
```
src/test/
├── setup.ts              # Configuración global
├── components/           # Tests de componentes
│   ├── App.test.tsx
│   ├── TaskBoard.test.tsx
│   ├── TaskForm.test.tsx
│   ├── TaskTimer.test.tsx
│   └── ...
├── hooks/               # Tests de hooks
│   └── useTasks.test.tsx
├── services/            # Tests de servicios
│   └── openaiService.test.ts
└── utils/               # Tests de utilidades
    └── taskUtils.test.ts
```

### Cobertura principal
- **App**: Navegación, vistas, temas (7 tests)
- **TaskForm**: Creación, edición, validación, IA (21 tests)
- **TaskTimer**: Cronometraje, notificaciones (6 tests)
- **useTasks**: Lógica de tareas y tiempo (10 tests)
- **openaiService**: Integración IA (16 tests)
- **Otros componentes**: TaskBoard, TaskTree, TimeStatsView, etc.

### Mocks configurados
- **localStorage**: Simulación de persistencia
- **AudioContext**: Sonidos de notificación
- **fetch**: Llamadas API de OpenAI
- **Temporizadores**: Control de tiempo con `vi.useFakeTimers()`

### Componentes críticos

#### TaskForm (21 tests)
- Renderizado y validación de formularios
- Funcionalidad IA (generación, errores, timeouts)
- Preservación de datos de timeTracking
- Restablecimiento de formularios

#### useTasks Hook (10 tests)
- Gestión de tareas (crear, editar, eliminar)
- Seguimiento de tiempo (iniciar, pausar, estadísticas)
- Persistencia en localStorage
- Relaciones padre-hijo de tareas

#### openaiService (16 tests)
- Generación de descripciones con IA
- Manejo de diferentes modelos (GPT-4, O1)
- Gestión de errores y timeouts
- Validación de configuración

## Pruebas E2E (End-to-End)

### Configuración Playwright
- **Solo Chromium**: Optimizado para velocidad y consistencia
- **Ejecución paralela**: Soporte para múltiples workers
- **Screenshots**: Capturas automáticas al final de cada test
- **Page Objects**: Patrón para mejor mantenibilidad

### Estructura de archivos E2E
```
e2e/
├── app.spec.ts                    # Funcionalidad básica (9 tests)
├── task-search.spec.ts             # Búsqueda (7 tests)
├── task-filtering.spec.ts          # Filtrado global (10 tests)
├── task-management.spec.ts         # Gestión de tareas (5 tests)
├── task-advanced.spec.ts           # IA y fechas (4 tests)
├── time-tracking.spec.ts           # Seguimiento de tiempo (3 tests)
├── time-stats.spec.ts              # Estadísticas (8 tests)
└── page-objects/
    ├── app.page.ts                 # Navegación general
    ├── task.page.ts                # Formularios de tareas
    ├── board.page.ts               # Vista Board
    └── timer.page.ts               # Funcionalidades de timer
```

### Casos de prueba E2E por categoría

#### Funcionalidad Básica (9 tests)
- Carga de aplicación y navegación
- Toggle de temas y persistencia
- Diseño responsivo móvil
- Exportar/importar funcionalidad

#### Gestión de Tareas (5 tests)
- Crear, editar, eliminar tareas
- Validación de campos requeridos
- Cancelación de formularios

#### Filtrado Global (10 tests)
- Filtros por estado en Board View (4 tests)
- Filtros por estado en Tree View con contexto jerárquico (4 tests)
- Consistencia entre vistas (2 tests)

#### Búsqueda (7 tests)
- Texto normal, caracteres especiales, números
- Búsqueda case-insensitive
- Búsqueda vacía y sin resultados

#### Funciones Avanzadas (4 tests)
- Creación de tareas con fechas de vencimiento
- Generación de descripción con IA 🤖
- Manejo de timeouts y cancelaciones de IA

#### Seguimiento de Tiempo (3 tests)
- Iniciar/detener timers
- Precisión de medición
- Exportación de datos CSV

#### Estadísticas de Tiempo (8 tests)
- Filtros temporales (Today, Week, Month, Year)
- **Filtro de fecha personalizada** 📅 (fix de zona horaria)
- Cambio entre filtros y visualización de datos

### Resultados E2E actuales
✅ **44/44 tests pasando** (100% de éxito)  
⏱️ **~1.2 minutos** con 4 workers  
🧹 **Sin logs indebidos** - Tests limpios y optimizados  
🌍 **Compatible globalmente** - Funciona en cualquier zona horaria

## Cómo ejecutar las pruebas

### Pruebas Unitarias
```bash
# Modo watch (desarrollo)
npm test

# Ejecución única
npx vitest run

# Con cobertura
npm run test:coverage

# Interface gráfica
npm run test:ui
```

### Pruebas E2E
```bash
# Suite completa (headless)
npm run test:e2e

# Con interfaz visual
npm run test:e2e:headed

# Con múltiples workers
npx playwright test e2e/ --workers=4

# Test específico
npx playwright test e2e/task-management.spec.ts

# Reporte HTML
npx playwright show-report
```

## Bugs corregidos

### 🔧 Bug crítico: Filtro de fechas personalizadas (Enero 2025)

#### Problema identificado
❌ **Error**: El filtro de fechas personalizadas no mostraba tareas cuando se seleccionaba la misma fecha de inicio y fin (ej: 2025-07-07 a 2025-07-07)

#### Causa raíz
- **Problema de zona horaria**: `new Date("2025-07-07")` se interpretaba como UTC
- **Rango incorrecto**: Ambas fechas se establecían a `00:00:00`
- **Tareas excluidas**: Timestamps como `05:19:45` no entraban en el rango

#### Solución implementada
✅ **Fix**: Usar parseo explícito de componentes de fecha:
```typescript
// ANTES (problemático)
const startDate = new Date(customStart);
const endDate = new Date(customEnd);

// DESPUÉS (corregido)
const startParts = customStart.split('-').map(Number);
const endParts = customEnd.split('-').map(Number);
const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0);
const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999);
```

#### Validación
✅ **Probado**: UTC-4 (República Dominicana)  
✅ **Compatible**: Funciona globalmente en cualquier zona horaria  
✅ **Test E2E**: Incluido en `time-stats.spec.ts`

#### Archivos modificados
- `src/components/TimeStatsView.tsx` - Lógica de parseo corregida
- `e2e/time-stats.spec.ts` - Test de validación

#### Impacto
🌍 **Global**: Funciona para usuarios en cualquier zona horaria  
✅ **Consistente**: Comportamiento idéntico al filtro "Today"  
📋 **Confiable**: Filtros personalizados funcionan con confianza

## Contribución

### Mejores prácticas
1. **TDD**: Escribir pruebas antes de implementar funcionalidad
2. **Cobertura**: Cada componente nuevo debe tener pruebas correspondientes
3. **Mocks**: Utilizar mocks existentes para localStorage y AudioContext
4. **Accesibilidad**: Usar `getByRole`, `getByTitle` sobre selectores CSS
5. **Independencia**: Cada test debe ser independiente y limpiar su estado

### Antes de enviar PR
- ✅ Ejecutar suite completa de pruebas unitarias
- ✅ Ejecutar pruebas E2E relevantes
- ✅ Verificar que no hay logs indebidos
- ✅ Actualizar documentación si es necesario

### Requisitos de ThemeProvider
Los siguientes componentes requieren `ThemeProvider` en sus tests:
- TaskItem, TaskTree, TaskTimer, TaskBoard, TaskForm, TimeStatsView

```jsx
import { ThemeProvider } from '../../contexts/ThemeContext';

render(
  <ThemeProvider>
    <ComponenteQueUsaTheme />
  </ThemeProvider>
);
```

---

**Última actualización**: Julio 2025 - Suite de testing completamente funcional, robusta y optimizada
