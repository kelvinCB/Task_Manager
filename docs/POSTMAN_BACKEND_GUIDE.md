# Guía para probar los endpoints API del Backend con Postman

Esta guía explica paso a paso cómo probar todos los endpoints listados en `docs/BACKEND_GUIDE.md` usando **Postman**.

---

## 1. Preparar el entorno

1. **Instalar Postman**
   - Descarga e instala la aplicación desde https://www.postman.com/downloads/.
2. **Clonar el proyecto** (si aún no lo tienes) y levantar el backend:
   ```bash
   cd /Users/kelvincalcano/Desktop/TaskLite-V1/Task_Manager/backend
   npm install
   npm run dev   # o npm start según tu configuración
   ```
   - El servidor escuchará en `http://localhost:3000` (puedes confirmar la URL en `backend/.env.example`).
3. **Crear un entorno en Postman**
   - En Postman, ve a **Environments → New** y crea un entorno llamado `TaskManager-Backend` con las siguientes variables:
     | Variable | Valor por defecto |
     |----------|-------------------|
     | `baseUrl` | `http://localhost:3000` |
     | `jwt`     | (vacío, se rellenará después) |
     | `taskId`  | (vacío, se rellenará después) |
     | `start`   | `2024-01-01` |
     | `end`     | `2024-01-31` |
     | `avatarFile` | `path/to/avatar.png` |
     | `filePath`   | `path/to/file.pdf` |
   - Selecciona este entorno en la barra superior de Postman.

---

## 2. Importar la colección de Postman

1. En la barra izquierda de Postman, haz clic en **Collections → Import**.
2. Selecciona **Upload Files** y elige el archivo JSON que generamos:
   ```
   /Users/kelvincalcano/.gemini/antigravity/brain/f1cbdad0-d3d0-42d1-8aaf-827e7c10d877/postman_backend_guide_collection.json
   ```
3. La colección aparecerá con el nombre **Task Manager Backend API**.

---

## 3. Autenticación (obtener JWT)

1. Expande la carpeta **Auth** y ejecuta la petición **Login**.
2. En el cuerpo, usa credenciales válidas (por ejemplo, `user@example.com` / `securepassword`).
3. Después de ejecutar, la respuesta contendrá un token JWT:
   ```json
   { "session": { "access_token": "eyJhbGciOi..." }, "user": { ... } }
   ```
4. Copia el valor de `access_token` y guárdalo en la variable de entorno `jwt`:
   - Haz clic en **Tests** de la petición y añade el siguiente script (Postman lo ejecutará automáticamente):
   ```javascript
   const json = pm.response.json();
   pm.environment.set('jwt', json.session.access_token);
   ```
   - Ejecuta la petición nuevamente; la variable `jwt` quedará poblada.

---

## 4. Probar los endpoints

A continuación se describen los grupos de endpoints y qué variables deben rellenarse antes de ejecutar cada petición.

### 4.1. Auth
| Petición | Qué hace | Variables necesarias |
|----------|----------|----------------------|
| Register | Crea un nuevo usuario | Ninguna (se envía `email` y `password` en el cuerpo) |
| Login    | Obtiene JWT (ver paso 3) | Ninguna |
| Forgot Password | Envía email de recuperación | Ninguna |
| Reset Password   | Cambia la contraseña usando `token` | Ninguna |

### 4.2. Tasks
| Petición | Qué hace | Variables necesarias |
|----------|----------|----------------------|
| Get All Tasks | Lista todas las tareas del usuario autenticado | `jwt` (en header) |
| Create Task   | Crea una nueva tarea | `jwt` y cuerpo con `title`, `description`, `status` |
| Get Task By ID| Obtiene una tarea específica | `jwt` y reemplazar `:id` por el ID real (puedes usar la variable `taskId` después de crear una) |
| Update Task   | Modifica una tarea | `jwt`, `:id`, cuerpo con campos a actualizar |
| Delete Task   | Elimina una tarea | `jwt`, `:id` |

**Tip:** Después de crear una tarea, copia el `_id` de la respuesta y guárdalo en la variable `taskId` con un script de test similar al del login:
```javascript
const json = pm.response.json();
pm.environment.set('taskId', json.id);
```

### 4.3. Time Entries
| Petición | Qué hace | Variables necesarias |
|----------|----------|----------------------|
| Start Timer   | Inicia el temporizador de una tarea | `jwt`, `taskId` |
| Stop Timer    | Detiene el temporizador | `jwt`, `taskId` |
| Get Summary   | Obtiene resumen entre `start` y `end` | `jwt`, `start`, `end` |
| Complete Entry| Registra una entrada completa con duración | `jwt`, `taskId` |

### 4.4. Profile
| Petición | Qué hace | Variables necesarias |
|----------|----------|----------------------|
| Upload Avatar | Sube una imagen de avatar | `jwt`, `avatarFile` (ruta al archivo local) |
| Delete Avatar | Elimina el avatar actual | `jwt` |

### 4.5. Upload (genérico)
| Petición | Qué hace | Variables necesarias |
|----------|----------|----------------------|
| Upload Generic File | Sube cualquier archivo (docs, imágenes, etc.) | `jwt`, `filePath` |

### 4.6. AI (proxy)
| Petición | Qué hace | Variables necesarias |
|----------|----------|----------------------|
| Chat Proxy | Envía un mensaje a OpenAI a través del backend | `jwt`, cuerpo con `messages` |

---

## 5. Ejecutar la colección completa

1. En la vista de la colección, haz clic en el botón **Run** (icono de play) en la parte superior.
2. Selecciona el entorno `TaskManager-Backend`.
3. Marca **Save responses** si deseas revisar los resultados después.
4. Haz clic en **Start Run**.
5. La colección se ejecutará en orden; si alguna petición depende de variables que aún no existen (por ejemplo, `taskId`), asegúrate de haber ejecutado previamente la petición que las genera.

---

## 6. Consejos de depuración

- **Código de estado 401**: indica que la variable `jwt` está vacía o caducada. Vuelve a ejecutar la petición **Login**.
- **Código de estado 404** en rutas con `:id`: verifica que la variable `taskId` corresponde a una tarea existente.
- **Errores de validación** (400): revisa el cuerpo JSON y asegúrate de que los campos obligatorios están presentes.
- Usa la pestaña **Console** de Postman (View → Show Postman Console) para ver logs y respuestas completas.

---

## 7. Exportar resultados

Una vez completadas las pruebas, puedes exportar los resultados:
1. En la ventana de **Runner**, haz clic en **Export Results**.
2. Selecciona formato **JSON** o **CSV** según necesites.
3. Guarda el archivo y compártelo con tu equipo.

---

### ¡Listo!
Con estos pasos podrás probar de forma exhaustiva todos los endpoints del backend directamente desde Postman, validar la autenticación, crear, actualizar y eliminar recursos, y comprobar la integración con los servicios de tiempo, perfil y AI.
