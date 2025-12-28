# Guía de Importación a BrowserStack Test Management

Esta guía detalla el proceso general para importar casos de prueba manuales generados desde nuestras suites E2E hacia BrowserStack Test Management.

## 1. Localización de Archivos CSV

Todos los archivos CSV generados para importación se almacenan en la siguiente ruta del proyecto:

`e2e/manual-test-cases-browserstack/`

Ejemplos de archivos que puedes encontrar allí:
- `auth.csv` (Tests de Autenticación)
- `tasks.csv` (Tests de Gestión de Tareas - Futuro)

## 2. Preparación en BrowserStack

1. Inicia sesión en [BrowserStack Test Management](https://test-management.browserstack.com/).
2. Selecciona tu proyecto (ej. **TaskLite**).
3. Navega a la sección **Test Cases**.
4. (Recomendado) Crea una carpeta específica para el módulo que vas a importar (ej. "Auth", "Tasks", "Billing") para mantener el orden.

## 3. Proceso de Importación

1. Haz clic en **"Import"** > **"Import from CSV"**.
2. Selecciona la carpeta de destino (la que creaste en el paso 2 o la raíz).
3. Sube el archivo CSV correspondiente desde carpeta `e2e/manual-test-cases-browserstack/`.

## 4. Mapeo de Columnas

Es crítico mapear correctamente las columnas del CSV a los campos de BrowserStack para asegurar que la información se importe con el formato correcto:

| Columna en CSV | Campo en BrowserStack | Propósito |
|----------------|-----------------------|-----------|
| **Title** | Title | Agrupa los pasos en un mismo Test Case. |
| **Description** | Description | Descripción general del objetivo del test. |
| **Preconditions** | Preconditions | Estado inicial requerido. |
| **Steps** | Steps | Pasos individuales de la prueba. |
| **Expected Result** | Expected Result | Resultado esperado de cada paso. |
| **Priority** | Priority | Prioridad (High, Medium, Low). |
| **Type** | Type | Tipo de test (Functional, Usability, etc.). |
| **Tags** | Tags | Etiquetas para filtrado (ej. Auth, Login). |
| **Automation Status** | Automation Status | Indica si el test ya está automatizado (Automated/Not Automated). |

## 5. Formato del Archivo CSV (Referencia Técnica)

Para que BrowserStack reconozca múltiples pasos dentro de un mismo caso de prueba, utilizamos un formato de **filas múltiples**:

- Cada paso del test ocupa una **fila separada**.
- Todas las filas que pertenecen al mismo test case comparten exactamente el mismo **Title** (Título).
- BrowserStack agrupa automáticamente estas filas en un único Test Case con pasos secuenciales.

**Ejemplo:**
```csv
Title,Steps,Expected Result
"Login Test","Step 1: Open App","App opens"
"Login Test","Step 2: Enter Creds","Creds entered"
"Login Test","Step 3: Submit","Logged in"
```
*Esto se importará como 1 Test Case llamado "Login Test" con 3 pasos.*
