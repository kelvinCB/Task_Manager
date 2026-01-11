# [DEPRECATED] Configuración Render + Vercel
## Table of Contents

- [[DEPRECATED] Configuración Render + Vercel](#deprecated-configuraci-n-render-vercel)
  - [Old Configuration (For Reference Only)](#old-configuration-for-reference-only)
  - [⚙️ Variables de Entorno](#variables-de-entorno)
  - [🚀 Pasos de Despliegue](#pasos-de-despliegue)
  - [🔧 Verificación](#verificaci-n)
- [Debe retornar: {"status":"healthy","timestamp":"...","environment":"production"}](#debe-retornar-status-healthy-timestamp-environment-production)
  - [🐛 Solución de Problemas](#soluci-n-de-problemas)
  - [📝 Notas](#notas)
  - [🎯 Siguiente Paso](#siguiente-paso)

## Old Configuration (For Reference Only)

- **Health Check:** https://task-manager-8p1p.onrender.com/health

## ⚙️ Variables de Entorno

### 📱 Frontend (Vercel)
En tu dashboard de Vercel, configura estas variables:

```
SUPABASE_URL=tu_supabase_url_real
SUPABASE_KEY=tu_SUPABASE_KEY_real
VITE_API_BASE_URL=https://task-manager-8p1p.onrender.com
OPENAI_API_KEY=tu_openai_key_opcional
VITE_OPENAI_MODEL=o4-mini-2025-04-16
```

### 🖥️ Backend (Render)
En tu dashboard de Render, configura estas variables:

```
NODE_ENV=production
SUPABASE_URL=tu_supabase_url_real
SUPABASE_KEY=tu_SUPABASE_KEY_real
FRONTEND_URL=https://task-manager-llwv.vercel.app
```

## 🚀 Pasos de Despliegue

### ✅ Backend (Render) - YA CONFIGURADO
Tu backend ya está funcionando en: https://task-manager-8p1p.onrender.com

### 📋 Frontend (Vercel) - Actualizar
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `task-manager-llwv`
3. Ve a **Settings** → **Environment Variables**
4. Agrega o actualiza: `VITE_API_BASE_URL=https://task-manager-8p1p.onrender.com`
5. **Redeploy** tu aplicación

## 🔧 Verificación

### Comprobar Backend:
```bash
curl https://task-manager-8p1p.onrender.com/health
# Debe retornar: {"status":"healthy","timestamp":"...","environment":"production"}
```

### Comprobar Integración:
1. Abre https://task-manager-llwv.vercel.app
2. Abre DevTools → Network
3. Verifica que las llamadas API vayan a `task-manager-8p1p.onrender.com`

## 🐛 Solución de Problemas

### Error CORS:
- Verificar que `FRONTEND_URL` en Render sea exactamente: `https://task-manager-llwv.vercel.app`

### Error de Conexión:
- Verificar que las variables `VITE_SUPABASE_...` estén correctamente copiadas en Vercel.

### Backend Inactivo:
- Vercel Serverless tiene "cold starts" (arranques en frío) de ~1-2 segundos si no se ha usado recientemente, pero no tiene el retardo de 40s+ de Render. Es normal una pequeña pausa en la primera petición del día.

## 📝 Notas

- ✅ Backend configurado y funcionando
- ✅ URLs específicas documentadas
- ✅ Variables de entorno listas para copiar
- ⏳ Falta: Actualizar variables en Vercel y redesplegar

## 🎯 Siguiente Paso

**IMPORTANTE:** Actualiza `VITE_API_BASE_URL` en Vercel con tu URL de Render y redespliega.
