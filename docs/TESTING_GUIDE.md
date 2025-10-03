# Task Manager - Guía de Testing

Esta guía documenta el enfoque de testing para la aplicación Task Manager, incluyendo pruebas unitarias, E2E y mejores prácticas.

## Índice

1. [Resumen General](#resumen-general)
2. [Pruebas Unitarias](#pruebas-unitarias)
3. [Pruebas de Backend](#pruebas-de-backend)
4. [Pruebas E2E (End-to-End)](#pruebas-e2e-end-to-end)
5. [Cómo ejecutar las pruebas](#cómo-ejecutar-las-pruebas)
6. [Bugs corregidos](#bugs-corregidos)
7. [Contribución](#contribución)

## Resumen General

### Estado Actual
✅ **131 pruebas unitarias** (100% pasando)  
✅ **66 pruebas E2E** (100% pasando)  
✅ **19 pruebas de backend** (100% pasando)  
✅ **Cobertura completa** de funcionalidades críticas  
✅ **Compatible globalmente** (todas las zonas horarias)
✅ **Feature de Username** con tests específicos implementados

### Tecnologías
- **Unitarias**: Vitest + React Testing Library + jsdom
- **E2E**: Playwright + Chromium
- **Backend**: Jest + Supertest + mocks
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
- **Authentication**: Páginas de login y registro, validación y flujos de autenticación (15 tests)
- **TaskForm**: Creación, edición, validación, IA (21 tests)
- **TaskTimer**: Cronometraje, notificaciones (6 tests)
- **useTasks**: Lógica de tareas y tiempo (10 tests)
- **openaiService**: Integración IA (16 tests)
- **AccountMenu**: Menú de cuenta con username display (11 tests)
- **useUserProfile**: Hook para gestión de perfiles de usuario (6 tests)
- **Otros componentes**: TaskBoard, TaskTree, TimeStatsView, etc.

### Mocks configurados
- **localStorage**: Simulación de persistencia
- **AudioContext**: Sonidos de notificación
- **fetch**: Llamadas API de OpenAI
- **Supabase**: Autenticación y respuestas de API
- **React Router**: Navegación entre páginas
- **Temporizadores**: Control de tiempo con `vi.useFakeTimers()`

### Componentes críticos

#### Authentication Pages (15 tests)
- LoginPage: Interfaz, validación, gestión de errores
- RegisterPage: Registro de usuarios, validación de datos
- Elementos UI: Animación del logo, botones sociales, gradientes
- Estados: Loading, error, navegación
- Responsive design y soporte para dark mode

#### Username Feature (17 tests)
- **AccountMenu (11 tests)**: Display de username, dropdown functionality, login/logout states
- **useUserProfile (6 tests)**: Fetch profile data, update profile, error handling
- Integración con Supabase para datos de perfil
- Generación automática de usernames aleatorios

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

## Pruebas de Backend

### Configuración y Tecnologías
- **Jest**: Framework de testing principal
- **Supertest**: Testing de endpoints HTTP
- **Mocks**: Cliente Supabase mockeado para testing aislado
- **Cobertura**: 90.62% en controladores, 100% en rutas

### Estructura de archivos Backend
```
backend/src/tests/
├── setup.js                           # Configuración global de tests
├── controllers/
│   └── authController.test.js         # Tests unitarios del controlador (10 tests)
└── routes/
    └── auth.test.js                   # Tests de integración de rutas (9 tests)
```

### Cobertura de Tests Backend

#### Controlador de Autenticación (10 tests)
- **Registro exitoso**: Validación de usuario registrado
- **Validación de entrada**: Email y contraseña requeridos
- **Validación de formato**: Email inválido, contraseña corta
- **Errores de Supabase**: Manejo de errores de autenticación
- **Errores inesperados**: Manejo de fallos del servidor

#### Rutas de Autenticación (9 tests)
- **POST /api/auth/register**: Tests de integración completos
- **POST /api/auth/login**: Tests de integración completos
- **Códigos de estado**: 200, 201, 400, 401, 500
- **Formatos de respuesta**: JSON estructurado
- **Rutas no encontradas**: Manejo de 404

### Características de Testing Backend
- **Mocking completo**: Supabase Auth completamente mockeado
- **Validación robusta**: Email format, password strength
- **Error handling**: Manejo completo de errores
- **HTTP Testing**: Requests/responses reales con Supertest
- **Configuración aislada**: Tests independientes sin efectos secundarios

### Resultados Backend
✅ **19/19 tests pasando** (100% de éxito)  
📊 **90.62%** cobertura en controladores  
📊 **100%** cobertura en rutas  
⚡ **Rápido**: Ejecución en ~25 segundos  
🔒 **Seguro**: Validación completa de inputs y errors

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
├── auth.spec.ts                   # Autenticación (15 tests)
├── task-search.spec.ts             # Búsqueda (7 tests)
├── task-filtering.spec.ts          # Filtrado global (10 tests)
├── task-management.spec.ts         # Gestión de tareas (5 tests)
├── task-advanced.spec.ts           # IA y fechas (4 tests)
├── time-tracking.spec.ts           # Seguimiento de tiempo (3 tests)
├── time-stats.spec.ts              # Estadísticas (8 tests)
├── username-display.spec.ts         # Display de username (8 tests)
├── global-setup.ts                 # Configuración global para tests
├── global-teardown.ts              # Limpieza global después de tests
└── page-objects/                   # Objetos de página para E2E
    ├── app.page.ts                 # Interacciones con la App
    ├── auth.page.ts                # Interacciones de Autenticación
    ├── board.page.ts               # Interacciones con TaskBoard
    ├── task.page.ts                # Interacciones con tareas
    ├── timer.page.ts               # Interacciones con Timer
    └── tree.page.ts                # Interacciones con TaskTree
```

### Casos de prueba E2E por categoría

#### Funcionalidad Básica (9 tests)
- Carga de aplicación y navegación
- Toggle de temas y persistencia
- Diseño responsivo móvil
- Menú My Account (verificación de botón y opciones)
- Funcionalidad Export/Import Tasks desde el menú de cuenta

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

#### Authentication (15 tests)
- **Login**: Acceso desde menú Account, validación de campos, gestión de errores (6 tests)
- **Logout**: Cierre de sesión y verificación de acceso restringido (1 test)
- **Register**: Registro de nuevos usuarios, validaciones, manejo de errores (5 tests)
- **UI Elements**: Verificación de botones sociales, links y estilos de página (3 tests)

#### Username Display (8 tests)
- **Button Display**: Verificación de "My Account" en estados autenticados y no autenticados (2 tests)
- **Dropdown Username**: Display del username generado automáticamente en dropdown (2 tests)
- **Mobile Consistency**: Funcionamiento consistente en vista móvil (1 test)
- **Authentication States**: Comportamiento correcto según estado de autenticación (2 tests)
- **UI Interactions**: Abrir/cerrar dropdown y click fuera para cerrar (1 test)

### Resultados E2E actuales
✅ **66/66 tests pasando** (100% de éxito)  
⏱️ **~1.4 minutos** con 4 workers  
🧹 **Sin logs indebidos** - Tests limpios y optimizados  
🌍 **Compatible globalmente** - Funciona en cualquier zona horaria
✨ **Username Feature** - Tests completos para display de username

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

### Pruebas Backend
```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias
npm install

# Ejecutar todos los tests
npm test

# Modo watch (desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage

# Test específico
npx jest src/tests/controllers/authController.test.js
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

**Última actualización**: Octubre 2025 - Suite de testing completamente funcional, robusta y optimizada con 216 tests (131 Frontend + 19 Backend + 66 E2E)
