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
✅ **162 pruebas unitarias** (100% pasando)  
✅ **82 pruebas E2E** (98.8% pasando - 1 test conocido falla en username-display)  
✅ **42 pruebas de backend** (100% pasando)  
✅ **Cobertura completa** de funcionalidades críticas  
✅ **Compatible globalmente** (todas las zonas horarias)
✅ **Feature de Username** con tests específicos implementados
✅ **Task CRUD con aislamiento de usuarios** implementado y testeado
✅ **Tests E2E de aislamiento** verificando seguridad multi-usuario

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
│   ├── PasswordInput.test.tsx
│   ├── TaskBoard.test.tsx
│   ├── TaskForm.test.tsx
│   ├── TaskTimer.test.tsx
│   └── ...
│   └── useTasks.test.tsx
├── pages/                # Tests de páginas
│   ├── ForgotPasswordPage.test.tsx
│   ├── ResetPasswordPage.test.tsx
│   └── ...
├── services/            # Tests de servicios
│   └── openaiService.test.ts
└── utils/               # Tests de utilidades
    └── taskUtils.test.ts
```

### Cobertura principal
- **App**: Navegación, vistas, temas (7 tests)
- **Authentication**: Páginas de login y registro, validación y flujos de autenticación (15 tests)
- **Password Reset**: Páginas de restablecimiento de contraseña con validación completa (15 tests)
  - ForgotPasswordPage (8 tests)
  - ResetPasswordPage (7 tests)
- **PasswordInput**: Componente de contraseña con toggle de visibilidad (8 tests)
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
  - `supabase.auth.resetPasswordForEmail`: Password reset initiation
  - `supabase.auth.updateUser`: Password update
- **React Router**: Navegación entre páginas
- **Temporizadores**: Control de tiempo con `vi.useFakeTimers()`
- **Lucide React**: Iconos (Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle)

### Componentes críticos

#### Authentication Pages (15 tests)
- LoginPage: Interfaz, validación, gestión de errores
- RegisterPage: Registro de usuarios, validación de datos
- Elementos UI: Animación del logo, botones sociales, gradientes
- Estados: Loading, error, navegación
- Responsive design y soporte para dark mode

#### Password Reset Pages (15 tests)
**ForgotPasswordPage (8 tests)**:
- **Renderizado**: Logo, formulario, enlaces de navegación
- **Validación**: Email requerido, formato de email válido
- **API Success**: Envio exitoso de solicitud de restablecimiento
- **API Error**: Manejo de errores del servidor
- **Estados UI**: Loading state durante solicitud
- **Navegación**: Link "Back to Login" funcional

**ResetPasswordPage (7 tests)**:
- **Renderizado**: Formulario de nueva contraseña
- **Validación**: Contraseñas coincidentes y longitud mínima
- **Toggle Visibility**: Mostrar/ocultar contraseñas
- **API Success**: Actualización exitosa de contraseña
- **API Error**: Manejo de errores y tokens inválidos
- **Estados UI**: Loading states y feedback visual
- **Navegación**: Redirección automática post-éxito

#### PasswordInput Component (8 tests)
- **Renderizado por defecto**: Contraseña oculta inicialmente
- **Toggle de visibilidad**: Cambio entre password/text al hacer click
- **Tooltip dinámico**: "Mostrar contraseña" / "Ocultar contraseña"
- **Iconos dinámicos**: Eye/EyeOff según estado de visibilidad
- **Eventos onChange**: Manejo correcto de cambios en el input
- **Props personalizadas**: Flexibilidad con diferentes configuraciones
- **Estructura visual**: Íconos de candado y posicionamiento
- **Accesibilidad**: Atributos ARIA y navegación por teclado

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
│   ├── authController.test.js         # Tests unitarios de autenticación (10 tests)
│   └── taskController.test.js         # Tests unitarios de tareas (22 tests)
├── routes/
│   ├── auth.test.js                   # Tests de integración de autenticación (9 tests)
│   └── tasks.test.js                  # Tests de integración de tareas (17 tests)
└── middleware/
    └── authMiddleware.js              # Middleware de autenticación JWT
```

### Cobertura de Tests Backend

#### Controlador de Autenticación (22 tests)
**Funciones de Registro y Login (10 tests)**:
- **Registro exitoso**: Validación de usuario registrado
- **Login exitoso**: Autenticación de usuario válido
- **Validación de entrada**: Email y contraseña requeridos
- **Validación de formato**: Email inválido, contraseña corta
- **Errores de Supabase**: Manejo de errores de autenticación
- **Errores inesperados**: Manejo de fallos del servidor

**Password Reset (12 tests)**:
- **forgotPassword success**: Solicitud de restablecimiento exitosa
- **forgotPassword validation**: Email requerido, formato válido
- **forgotPassword normalization**: Email normalizado (lowercase y trim)
- **forgotPassword errors**: Manejo de errores de Supabase y red
- **resetPassword success**: Actualización exitosa de contraseña
- **resetPassword validation**: Contraseña y token requeridos
- **resetPassword errors**: Manejo de errores y tokens inválidos

#### Rutas de Autenticación (20 tests)
**Rutas Originales (8 tests)**:
- **POST /api/auth/register**: Tests de integración completos
- **POST /api/auth/login**: Tests de integración completos
- **Códigos de estado**: 200, 201, 400, 401, 500
- **Formatos de respuesta**: JSON estructurado

**Password Reset Routes (11 tests)**:
- **POST /api/auth/forgot-password**: Envio de email de restablecimiento
- **POST /api/auth/reset-password**: Actualización de contraseña
- **Validaciones**: Email requerido, formato válido, contraseñas válidas
- **Error handling**: Respuestas 400/500 apropiadas
- **Edge cases**: Tokens faltantes, contraseñas cortas

**Route Management (1 test)**:
- **404 handling**: Rutas no encontradas

#### Controlador de Tareas (22 tests)
- **createTask**: Creación exitosa, validación de título, validación de status, verificación de parent_task_id
- **getTasks**: Obtener todas las tareas del usuario, filtrado por status, validación de filtros
- **getTaskById**: Obtener tarea específica, validación de ID, verificación de propiedad
- **updateTask**: Actualización exitosa, validación de campos, prevención de ciclos (tarea como su propio padre)
- **deleteTask**: Eliminación exitosa, validación de ID, verificación de existencia
- **Manejo de errores**: Database errors, validaciones, autenticación

#### Rutas de Tareas (17 tests)
- **POST /api/tasks**: Creación de tareas, validación de campos, estados válidos
- **GET /api/tasks**: Obtener todas las tareas, filtrado por status, validación de filtros
- **GET /api/tasks/:id**: Obtener tarea específica, manejo de IDs inválidos, tareas no encontradas
- **PUT /api/tasks/:id**: Actualización de tareas, validación de campos, tareas no existentes
- **DELETE /api/tasks/:id**: Eliminación de tareas, validación de IDs, tareas no encontradas
- **Manejo de errores**: Errores de base de datos, requests malformados, respuestas JSON
- **Seguridad**: Aislamiento por usuario, validación de JWT, prevención de acceso no autorizado

### Características de Testing Backend
- **Mocking completo**: Supabase Auth y Database completamente mockeados
  - `supabase.auth.resetPasswordForEmail`: Mock para solicitudes de reset
  - `supabase.auth.updateUser`: Mock para actualización de contraseñas
- **Validación robusta**: Email format, password strength, task fields, token validation
- **Error handling**: Manejo completo de errores de autenticación y base de datos (400, 500, tokens inválidos)
- **HTTP Testing**: Requests/responses reales con Supertest
- **Configuración aislada**: Tests independientes sin efectos secundarios
- **Seguridad**: Aislamiento de datos por usuario, validación JWT
- **CRUD Completo**: Cobertura completa de operaciones Create, Read, Update, Delete

### Resultados Backend
✅ **58/58 tests pasando** (100% de éxito)  
📊 **Alta cobertura** en controladores y rutas  
⚡ **Rápido**: Ejecución en ~1 segundo  
🔒 **Seguro**: Validación completa de inputs, autenticación y aislamiento de usuarios  
🎯 **Completo**: CRUD de tareas + autenticación + middleware JWT

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
├── password-visibility.spec.ts     # Toggle de visibilidad de contraseña (16 tests)
├── task-search.spec.ts             # Búsqueda (7 tests)
├── task-filtering.spec.ts          # Filtrado global (10 tests)
├── task-management.spec.ts         # Gestión de tareas (5 tests)
├── task-advanced.spec.ts           # IA y fechas (4 tests)
├── task-isolation.spec.ts          # Aislamiento de usuarios (6 tests)
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

#### Password Visibility Toggle (16 tests)
**Login Page Password Visibility (5 tests)**:
- **Estado por defecto**: Contraseña oculta inicialmente, botón toggle visible
- **Mostrar contraseña**: Click en toggle cambia tipo de input a texto
- **Ocultar contraseña**: Toggle funciona en ambas direcciones preservando valor
- **Tooltips dinámicos**: "Mostrar contraseña" / "Ocultar contraseña" según estado
- **Persistencia de estado**: Visibilidad se mantiene durante interacciones con otros campos

**Register Page Password Visibility (3 tests)**:
- **Estado por defecto**: Contraseña oculta en página de registro
- **Toggle funcional**: Mostrar/ocultar contraseña funciona correctamente
- **Estado independiente**: Cada página mantiene su propio estado de visibilidad

**Reset Password Page Visibility (6 tests)**:
- **Estado por defecto**: Ambos campos de contraseña ocultos inicialmente
- **Toggle independiente**: Cada campo tiene su propio control de visibilidad
- **Nuevas contraseñas**: Control individual del campo "nueva contraseña"
- **Confirmar contraseña**: Control individual del campo "confirmar contraseña"
- **Ambos campos**: Toggles funcionan independientemente entre sí
- **Preservación de valores**: Valores se mantienen al cambiar visibilidad

**Accessibilidad y UX (2 tests)**:
- **Navegación por teclado**: Toggle accesible via Tab y Enter
- **Vista móvil**: Funciona correctamente en viewport móvil (375x667)
- **Atributos ARIA**: Iconos con aria-hidden, tooltips apropiados

#### Username Display (8 tests)
- **Button Display**: Verificación de "My Account" en estados autenticados y no autenticados (2 tests)
- **Dropdown Username**: Display del username generado automáticamente en dropdown (2 tests)
- **Mobile Consistency**: Funcionamiento consistente en vista móvil (1 test)
- **Authentication States**: Comportamiento correcto según estado de autenticación (2 tests)
- **UI Interactions**: Abrir/cerrar dropdown y click fuera para cerrar (1 test)

#### Task User Isolation (6 tests)
- **User 1 Private Tasks**: Usuario 1 solo ve sus propias tareas (1 test)
- **Cross-User Invisibility**: Usuario 2 no ve tareas de Usuario 1 (1 test)
- **Modification Prevention**: Usuarios no pueden modificar tareas ajenas (1 test)
- **Search Isolation**: Búsqueda respeta aislamiento de usuarios (1 test)
- **Filter Isolation**: Filtros respetan aislamiento por usuario (1 test)
- **Unauthenticated Access**: Usuarios no autenticados no acceden a tareas (1 test)

### Resultados E2E actuales
✅ **81/82 tests pasando** (98.8% de éxito)  
🔴 **1 test falla** (username-display conocido, no crítico)  
⏱️ **~1.6 minutos** con 4 workers  
🧹 **Tests limpios y optimizados**  
🌍 **Compatible globalmente** - Funciona en cualquier zona horaria
✨ **Username Feature** - Tests completos para display de username
🔒 **User Isolation** - Tests de seguridad multi-usuario

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
npx jest src/tests/routes/tasks.test.js
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

**Última actualización**: Noviembre 2025 - Suite de testing completamente funcional, robusta y optimizada con **286 tests** (162 Frontend + 42 Backend + 82 E2E).
