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

✅ **340 pruebas unitarias** (100% pasando)
✅ **135 pruebas E2E** (100% pasando)
✅ **141 pruebas de backend** (100% pasando)
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
│   ├── openaiService.test.ts
│   └── taskService.test.ts   # Verifica que no se envíen updates vacíos al backend
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
- **Contexts**: ThemeContext (7 tests), AuthContext (8 tests)
- **Modals**: AuthRequiredModal (9 tests), ImageCropModal (8 tests), RegistrationSuccessModal (7 tests)
- **UI Components**: LoginButton (7 tests), AttachmentList (9 tests), BurgerMenu (8 tests), TaskStats (7 tests)
- **Icons**: AIIcon (7 tests), ProgressIcon (8 tests), FlagIcons (4 tests)
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

#### openaiService (20 tests)

- Generación de descripciones con IA
- Mejora de gramática (improveGrammar) 🆕
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
  - Compatibilidad con el nuevo export de cliente: `{ supabase, createClientWithToken }` (per-request JWT para RLS). Los tests usan un `buildClient()` para simular ambas formas (legacy y actual).
- **Validación robusta**: Email format, password strength, task fields, token validation
- **Error handling**: Manejo completo de errores de autenticación y base de datos (400, 500, tokens inválidos)
- **HTTP Testing**: Requests/responses reales con Supertest
- **Configuración aislada**: Tests independientes sin efectos secundarios
- **Seguridad**: Aislamiento de datos por usuario, validación JWT
- **CRUD Completo**: Cobertura completa de operaciones Create, Read, Update, Delete

## Manual Testing (Google Auth)

Since Google Authentication requires interactions with real Google servers and accounts, it cannot be fully automated in CI/CD without exposing credentials. Follow these steps to verify:

### Prerequisites
1.  Ensure you have a valid Google account.
2.  Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` are configured in `.env`.
3.  Ensure Google Provider is enabled in Supabase Dashboard.
4.  Ensure `http://localhost:5173/auth/callback` (or your local port) is in Supabase Redirect URLs.

### Test Cases

#### TC-MAN-001: Google Login Flow
1.  Navigate to `/login`.
2.  Click "Log in with Google" button.
3.  **Expected**: Pop-up window or redirect to accounts.google.com.
4.  Enter valid credentials.
5.  **Expected**: Redirect back to app (`/`) and user is logged in (visible in Account Menu).

#### TC-MAN-002: Google Registration Flow
1.  Navigate to `/register`.
2.  Click "Sign up with Google".
3.  **Expected**: Same behavior as Login (Google treats them interchangeably for OAuth).
4.  **Verification**: Check Supabase Dashboard > Authentication > Users to see the new user with `google` provider.

#### TC-MAN-003: Existing Account Link
1.  If you have an existing account with `example@gmail.com` (password based).
2.  Try to Log in with Google using the same email.
3.  **Expected**: Supabase should link the identities or log you in (depending on project config "Enable Confirm Email").

### Troubleshooting
- **400: redirect_uri_mismatch**: Check that the URL in the browser address bar exactly matches one of the "Redirect URLs" in Supabase.
#### TC-MAN-004: GitHub Login Flow
1.  Navigate to `/login`.
2.  Click "Log in with GitHub" button.
3.  **Expected**: Redirect to GitHub authorization page.
4.  Authorize the application.
5.  **Expected**: Redirect back to app and user is logged in.

#### TC-MAN-005: GitHub Registration Flow
1.  Navigate to `/register`.
2.  Click "Sign up with GitHub".
3.  **Expected**: Same behavior as Login.
4.  **Verification**: Check Supabase Dashboard > Authentication > Users to see the new user with `github` provider.

### Resultados Backend

✅ **82/82 tests pasando** (100% de éxito)
📊 **Alta cobertura** en controladores y rutas
⚡ **Rápido**: Ejecución en ~1.2 segundos
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
├── task-hierarchy.spec.ts          # Jerarquía y subtareas (2 tests)
├── task-drag-drop.spec.ts          # Drag and drop en Board (2 tests)
├── task-detail.spec.ts             # Vista de detalle (2 tests)
├── i18n.spec.ts                   # Multi-idioma (3 tests)
├── time-tracking.spec.ts           # Seguimiento de tiempo (4 tests)
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

### Protocolo de Nuevos Tests E2E

Para cada nuevo test automatizado que se agregue a la suite E2E, es **OBLIGATORIO** crear su contraparte manual en un archivo CSV.

1.  **Ubicación**: Los archivos CSV deben guardarse en `e2e/manual-test-cases-browserstack`.
2.  **Formato**: Debes seguir estrictamente la regla de "multisteps" detallada en la guía de importación.
3.  **Referencia**: Consulta `docs/BROWSERSTACK_IMPORT_GUIDE.md` para ver las reglas de formato, columnas requeridas y ejemplos.

> **Regla de Oro**: 1 Test Automatizado = 1 Test Manual en CSV (Mapeo 1:1).

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
- **Soporte para timers concurrentes** ⏱️

#### Estadísticas de Tiempo (8 tests)

- Filtros temporales (Today, Week, Month, Year)
- **Filtro de fecha personalizada** 📅 (fix de zona horaria)
- Cambio entre filtros y visualización de datos

#### Task Hierarchy (2 tests)

- Creación de subtareas desde Tree View
- Verificación de sangría y jerarquía visual

#### Drag and Drop (2 tests)

- Movimiento de tareas entre columnas 'Open' e 'In Progress'
- Verificación de persistencia de estado post-drop

#### Task Detail View (2 tests)

- Apertura de modal de detalle al hacer click en el título
- Verificación de integridad de datos en el detalle

#### Internationalization (3 tests)

- Cambio de idioma a Español en Login y Dashboard
- Verificación de persistencia tras recarga de página
- Verificación de traducciones en cabeceras y vistas principales

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

✅ **134/134 tests pasando** (100% de éxito)
✅ **Todos los tests funcionando** (incluido username-display)⏱️ **~2.6 minutos** con 5 workers🧹 **Tests limpios y optimizados**🌍 **Compatible globalmente** - Funciona en cualquier zona horaria
✨ **Username Feature** - Tests completos para display de username
🔒 **User Isolation** - Tests de seguridad multi-usuario

> Nota: En modo autenticado no se muestran tareas por defecto; en modo offline/no autenticado se usan `defaultTasks`/localStorage. Los tests de `useTasks` cubren ambos flujos.

## Variables de Entorno para Testing

### Resumen de Configuración

El proyecto utiliza diferentes archivos `.env` para diferentes entornos de testing:

| Tipo de Test        | Archivo Env          | Carga Automática       | Notas                              |
| ------------------- | -------------------- | ----------------------- | ---------------------------------- |
| **Unitarios** | `.env.development` | ✅ Sí (via Vitest)     | Usa mocks, credenciales opcionales |
| **Backend**   | `.env` (backend)   | ✅ Sí (via Jest)       | Credenciales de desarrollo         |
| **E2E**       | `.env.production`  | ✅ Sí (via dotenv-cli) | Requiere backend en producción    |

### Prefijos de Variables

- **`VITE_`**: Variables expuestas al cliente (frontend)

  - Ejemplos: `VITE_SUPABASE_URL`, `VITE_OPENAI_API_KEY`
  - Usadas en: Código del navegador, E2E tests
- **Sin prefijo**: Variables solo del servidor/scripts

  - Ejemplos: `E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`
  - Usadas en: Scripts de test, global-setup

### Archivos de Ejemplo

- **`.env.example`**: Template con todas las variables necesarias
- **`.env.development.example`**: Específico para desarrollo (si existe)
- **`.env.production.example`**: Específico para producción (si existe)

**⚠️ Importante**: Nunca commitear archivos `.env` con credenciales reales. Usar siempre los archivos `.example` como referencia.

## Cómo ejecutar las pruebas

### Pruebas Unitarias

#### Variables de Entorno

Las pruebas unitarias usan automáticamente las variables de entorno de `.env.development`:

```bash
# Supabase Development
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_KEY=eyJhbG...

# OpenAI Development (opcional para tests)
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=o4-mini-2025-04-16
```

**Nota**: Las pruebas unitarias utilizan mocks extensivos, por lo que las credenciales reales de Supabase y OpenAI no son necesarias para la mayoría de los tests.

#### Comandos de Ejecución

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

#### Variables de Entorno

Las pruebas E2E requieren variables de entorno de producción configuradas en `.env.production`:

```bash
# Supabase (con prefijo VITE_ para Vite)
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_KEY=eyJhbG...

# OpenAI (con prefijo VITE_)
VITE_OPENAI_API_KEY=sk-proj-...
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=o4-mini-2025-04-16

# Credenciales de usuario de prueba E2E
E2E_TEST_USER_EMAIL=taski-test@yopmail.com
E2E_TEST_USER_PASSWORD=holamundo1
```

**Nota importante**: Las pruebas E2E **deben ejecutarse con el backend en modo producción**:

```bash
# 1. Iniciar backend en producción primero
npm run start

# 2. En otra terminal, ejecutar las pruebas E2E
npm run test:e2e
```

#### Comandos de Ejecución

```bash
# Suite completa (headless) - usa .env.production automáticamente
npm run test:e2e

# Con interfaz visual
npm run test:e2e:headed

# Solo chromium (más rápido)
npm run test:e2e:headless

# Modo debug
npm run test:e2e:debug

# Con múltiples workers (requiere backend activo)
npx dotenv -e .env.production -- playwright test e2e/ --workers=5

# Test específico
npx dotenv -e .env.production -- playwright test e2e/task-management.spec.ts

# Reporte HTML
npx playwright show-report
```

**📚 Documentación completa**: Ver `docs/E2E_ENV_CONFIG.md` para más detalles sobre la configuración de variables de entorno.

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

**Última actualización**: Enero 2026 - Suite de testing completamente funcional, robusta y optimizada con **604 tests** (333 Frontend + 137 Backend + 134 E2E).
