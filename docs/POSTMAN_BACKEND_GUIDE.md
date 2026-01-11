# Guía de Postman para el Backend (Task Manager)

Esta guía te ayudará a probar todos los endpoints documentados en `BACKEND_GUIDE.md` paso a paso.

---

## 1. Configuración Inicial en Postman

Para trabajar de forma eficiente, configuraremos un **Environment** (Entorno) en Postman.

1. Abre Postman.
2. Haz clic en **Environments** (barra lateral izquierda) -> **+** (Create Environment).
3. Nómbralo como `Task Manager - Local`.
4. Agrega las siguientes variables:
   - `baseUrl`: `http://localhost:3001`
   - `jwt_token`: (deja el valor inicial vacío)
5. Haz clic en **Save** y asegúrate de seleccionar el entorno en el selector de la esquina superior derecha.

---

## 2. Autenticación (El primer paso)

Casi todos los endpoints requieren estar autenticado. Primero debemos registrar un usuario u obtener el token de uno existente.

### A. Registro de Usuario
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/auth/register`
- **Body** (raw -> JSON):
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

### B. Login (Obtener Token)
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Body** (raw -> JSON):
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **IMPORTANTE:** De la respuesta, copia el valor de `session.access_token`. 
- **Tip Pro:** Puedes automatizar esto pegando este código en la pestaña **Tests** de la request de login:
  ```javascript
  const jsonData = pm.response.json();
  pm.environment.set("jwt_token", jsonData.session.access_token);
  ```

---

## 3. Configuración de Autorización Global

Para no tener que pegar el token en cada request:

1. Crea una **Collection** llamada `Task Manager API`.
2. Haz clic derecho en la colección -> **Edit**.
3. Ve a la pestaña **Authorization**.
4. Type: **Bearer Token**.
5. Token: `{{jwt_token}}`.
6. Haz clic en **Save**.

*Ahora, todas las requests que metas en esta colección usarán el token automáticamente si seleccionas "Inherit auth from parent" en su pestaña de Authorization.*

---

## 4. Endpoints de Tareas (Protected)

### Obtener todas las tareas
- **Método:** `GET`
- **URL:** `{{baseUrl}}/api/tasks`

### Crear una tarea
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/tasks`
- **Body** (JSON):
  ```json
  {
    "title": "Mi primera tarea desde Postman",
    "description": "Probando el endpoint",
    "status": "In Progress"
  }
  ```

### Actualizar una tarea
- **Método:** `PUT`
- **URL:** `{{baseUrl}}/api/tasks/:id` (Reemplaza `:id` por el ID real de una tarea que creaste)
- **Body** (JSON):
  ```json
  {
    "title": "Tarea actualizada",
    "status": "Done"
  }
  ```

---

## 5. Endpoints de Registro de Tiempo (Time Entries)

Este módulo permite medir cuánto tiempo dedicas a cada tarea.

### Iniciar Temporizador
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/time-entries/start`
- **Body** (JSON):
  ```json
  {
    "task_id": "TU_UUID_DE_TAREA"
  }
  ```
- > [!IMPORTANT]
  > Usa **snake_case** (`task_id` con guion bajo). Si usas `taskId`, el servidor te dará un error de validación.

### Detener Temporizador
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/time-entries/stop`
- **Body** (JSON):
  ```json
  {
    "task_id": "TU_UUID_DE_TAREA"
  }
  ```
- *Esto buscará el último temporizador abierto de esa tarea y lo cerrará con la hora actual.*

### Resumen de Tiempos
- **Método:** `GET`
- **URL:** `{{baseUrl}}/api/time-entries/summary?start=2024-01-01&end=2024-12-31`
- *Devuelve el total de milisegundos invertidos por tarea en ese rango de fechas.*

---

## 6. Endpoints de AI (OpenAI Proxy)

### Chat con AI
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/ai/chat`
- **Body** (JSON):
  ```json
  {
    "messages": [
      { "role": "user", "content": "Genera una lista de 3 sub-tareas para: 'Lavar el coche'" }
    ]
  }
  ```

---

## 6. Otros Endpoints Importantes

### Subir Archivos (Generics)
- **Método:** `POST`
- **URL:** `{{baseUrl}}/api/upload`
- **Body**: Cambia a **form-data**.
  - Key: `file`, Type: **File**, selecciona un archivo de tu PC.

### Salud del Sistema
- **Método:** `GET`
- **URL:** `{{baseUrl}}/health`
- *No requiere autenticación.*

---

## Resumen de Tips
1. **Status Codes:** Espera `200` o `210` para éxito, `401` si el token expiró/falta, y `400` si te falta algún campo en el JSON.
2. **Variables:** Usa siempre `{{baseUrl}}` para que cambiar de local a producción sea tan fácil como cambiar de Environment.
3. **JSON:** Asegúrate de que el header `Content-Type` sea `application/json` (Postman lo hace solo al elegir el modo raw -> JSON).
