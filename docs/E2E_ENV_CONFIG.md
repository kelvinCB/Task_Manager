# E2E Environment Configuration
## Table of Contents

- [E2E Environment Configuration](#e2e-environment-configuration)
  - [📋 Overview](#overview)
  - [🔧 Configuración Realizada](#configuraci-n-realizada)
  - [📦 Dependencias Instaladas](#dependencias-instaladas)
  - [✅ Variables de Entorno Requeridas](#variables-de-entorno-requeridas)
- [Supabase (con prefijo VITE_ para Vite)](#supabase-con-prefijo-vite-para-vite)
- [OpenAI (con prefijo VITE_)](#openai-con-prefijo-vite)
- [Credenciales de usuario de prueba E2E](#credenciales-de-usuario-de-prueba-e2e)
  - [🚀 Cómo Ejecutar las Pruebas E2E](#c-mo-ejecutar-las-pruebas-e2e)
- [Ejecutar todas las pruebas E2E](#ejecutar-todas-las-pruebas-e2e)
- [Ejecutar con interfaz visible](#ejecutar-con-interfaz-visible)
- [Ejecutar en modo headless (CI)](#ejecutar-en-modo-headless-ci)
- [Ejecutar en modo debug](#ejecutar-en-modo-debug)
- [Con npx](#con-npx)
- [Con workers específicos](#con-workers-espec-ficos)
  - [🔍 Verificación de Variables](#verificaci-n-de-variables)
  - [⚠️ Notas Importantes](#notas-importantes)
  - [🐛 Troubleshooting](#troubleshooting)
  - [📚 Referencias](#referencias)

## 📋 Overview

Las pruebas End-to-End (E2E) con Playwright ahora están configuradas para usar las variables de entorno de `.env.production`.

---

## 🔧 Configuración Realizada

### 1. **playwright.config.ts**
```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load .env.production file
dotenv.config({ path: path.resolve(__dirname, '.env.production') });
```

- Carga automática de variables de `.env.production`
- Pasa todas las variables `VITE_*` al servidor de desarrollo
- Incluye credenciales de usuario de prueba (`E2E_TEST_USER_EMAIL` y `E2E_TEST_USER_PASSWORD`)

### 2. **package.json Scripts**
```json
{
  "test:e2e": "dotenv -e .env.production -- playwright test",
  "test:e2e:headed": "dotenv -e .env.production -- playwright test --headed",
  "test:e2e:headless": "dotenv -e .env.production -- playwright test --project=chromium",
  "test:e2e:debug": "dotenv -e .env.production -- playwright test --debug"
}
```

- Todos los scripts E2E ahora cargan `.env.production` usando `dotenv-cli`

### 3. **global-setup.ts**
```typescript
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
```

- Validación de variables de entorno al inicio de las pruebas
- Muestra qué variables están cargadas correctamente

---

## 📦 Dependencias Instaladas

```bash
npm install --save-dev dotenv-cli
```

- **dotenv-cli**: Permite cargar archivos `.env` específicos en scripts npm

---

## ✅ Variables de Entorno Requeridas

En `.env.production`:

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

---

## 🚀 Cómo Ejecutar las Pruebas E2E

### Método 1: Usar npm scripts (Recomendado)
```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar con interfaz visible
npm run test:e2e:headed

# Ejecutar en modo headless (CI)
npm run test:e2e:headless

# Ejecutar en modo debug
npm run test:e2e:debug
```

### Método 2: Comando directo
```bash
# Con npx
npx dotenv -e .env.production -- playwright test

# Con workers específicos
npx dotenv -e .env.production -- playwright test --workers=4
```

---

## 🔍 Verificación de Variables

Al ejecutar las pruebas, verás un mensaje de confirmación:

```
🔧 E2E Global Setup: Environment variables loaded from .env.production
VITE_SUPABASE_URL: ✅ Loaded
VITE_SUPABASE_KEY: ✅ Loaded
VITE_OPENAI_API_KEY: ✅ Loaded
E2E_TEST_USER_EMAIL: taski-test@yopmail.com
E2E_TEST_USER_PASSWORD: ✅ Loaded
```

---

## ⚠️ Notas Importantes

1. **Prefijo VITE_**: Todas las variables de entorno del cliente deben tener el prefijo `VITE_` para que Vite las exponga al navegador.

2. **Usuario de Prueba**: Las credenciales de E2E (`E2E_TEST_USER_EMAIL` y `E2E_TEST_USER_PASSWORD`) **NO necesitan** el prefijo `VITE_` porque solo las usan los scripts de prueba, no el código del cliente.

3. **Modo Producción**: El servidor de desarrollo se inicia con `--mode production` para usar `.env.production`:
   ```bash
   npm run dev -- --mode production
   ```

4. **Reuso del Servidor**: Si ya tienes el servidor corriendo en `localhost:5173`, Playwright lo reutilizará automáticamente.

---

## 🐛 Troubleshooting

### Error: "X Missing"
Si ves `❌ Missing` para alguna variable:
1. Verifica que `.env.production` existe en la raíz del proyecto
2. Verifica que la variable tiene el prefijo `VITE_` correcto
3. Reinicia las pruebas E2E

### Error: "SUPABASE_URL is not defined"
Este error indica que las variables no se están cargando. Soluciones:
- Asegúrate de usar `npm run test:e2e` (no `playwright test` directamente)
- Verifica que `dotenv-cli` está instalado
- Verifica la ruta del archivo `.env.production`

### Error: "User already exists"
Si el usuario de prueba ya existe en la base de datos, las pruebas de registro fallarán. Soluciones:
- Elimina el usuario de la base de datos de Supabase
- O usa un email diferente en `E2E_TEST_USER_EMAIL`

---

## 📚 Referencias

- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [dotenv-cli Documentation](https://github.com/entropitor/dotenv-cli)
- [Supabase Documentation](https://supabase.com/docs)

---

**Última actualización**: 2025-10-22
