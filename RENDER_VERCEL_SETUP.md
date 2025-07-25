# Configuración Render + Vercel - Task Manager

## 🔗 URLs del Proyecto

- **Frontend (Vercel):** https://task-manager-llwv.vercel.app
- **Backend (Render):** https://task-manager-8p1p.onrender.com
- **Health Check:** https://task-manager-8p1p.onrender.com/health

## ⚙️ Variables de Entorno

### 📱 Frontend (Vercel)
En tu dashboard de Vercel, configura estas variables:

```
VITE_SUPABASE_URL=tu_supabase_url_real
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_real
VITE_API_BASE_URL=https://task-manager-8p1p.onrender.com
VITE_OPENAI_API_KEY=tu_openai_key_opcional
VITE_OPENAI_MODEL=o4-mini-2025-04-16
```

### 🖥️ Backend (Render)
En tu dashboard de Render, configura estas variables:

```
NODE_ENV=production
SUPABASE_URL=tu_supabase_url_real
SUPABASE_KEY=tu_supabase_anon_key_real
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
- Verificar que `VITE_API_BASE_URL` en Vercel sea exactamente: `https://task-manager-8p1p.onrender.com`

### Backend Inactivo:
- Render puede "dormir" servicios gratuitos. La primera petición puede tardar 30 segundos.

## 📝 Notas

- ✅ Backend configurado y funcionando
- ✅ URLs específicas documentadas
- ✅ Variables de entorno listas para copiar
- ⏳ Falta: Actualizar variables en Vercel y redesplegar

## 🎯 Siguiente Paso

**IMPORTANTE:** Actualiza `VITE_API_BASE_URL` en Vercel con tu URL de Render y redespliega.
