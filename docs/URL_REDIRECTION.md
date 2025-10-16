# 🔗 URL Redirection Configuration Guide

## 📋 Overview

This guide documents the URL redirection configuration for the Task Manager application, ensuring proper authentication flows between development and production environments.

---

## 🎯 Key Configuration Points

### 1. Environment Variables Setup

Ensure your `.env` file points to the correct Supabase URLs based on your target environment:

```env
# For Development Environment
VITE_SUPABASE_URL=https://xktrbmbuneceginxqshy.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key


# For Production Environment (uncomment when needed)
# VITE_SUPABASE_URL=https://uuepapqtfvufcgxvghwn.supabase.co
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase URL Configuration

Configure your Supabase project URLs for different environments:

1. **Access your Supabase project** (e.g., "task manager dev")
2. **Navigate to**: Authentication → URL Configuration
3. **Configure URLs**:
   - **Site URL**: Your main application URL
   - **Redirect URLs**: Add both development and production URLs

**Example URL Configuration:**
```
Site URL: https://task-manager-llwv.vercel.app/
Redirect URLs:
- https://task-manager-llwv.vercel.app/reset-password
- http://localhost:5173/reset-password (for development)
```

**Supabase URL Configuration Path:**
```
https://supabase.com/dashboard/project/xktrbmbuneceginxqshy/auth/url-configuration
```

### 3. Frontend URL Environment Variable

**Important:** Do NOT set `FRONTEND_URL` in:
- Vercel environment variables
- Frontend `.env` file

The application automatically handles URL redirection through Vercel's deployment configuration.

### 4. Vercel Configuration

Ensure your project has the `vercel.json` file at the root level:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This configuration enables proper SPA routing for password reset links and other authentication flows.

---

## 🔄 Authentication Flow

### Password Reset Process

1. User requests password reset
2. Backend sends reset email via Supabase
3. User clicks link in email
4. Supabase redirects to configured URL with reset token
5. Frontend handles token and allows password update

### URL Resolution

- **Development**: `http://localhost:5173/reset-password`
- **Production**: `https://task-manager-llwv.vercel.app/reset-password`

---

## 🧪 Testing Configuration

### Development Testing

1. Set `.env` to development Supabase URLs
2. Ensure Supabase project has `http://localhost:5173/reset-password` in redirect URLs
3. Test password reset flow locally

### Production Testing

1. Set `.env` to production Supabase URLs
2. Ensure Supabase project has production URL in redirect URLs
3. Deploy to Vercel and test password reset flow

---

## ⚠️ Important Notes

- **Environment Consistency**: Always ensure your `.env` Supabase URLs match the environment you're testing
- **URL Configuration**: Both site URL and redirect URLs must be configured in Supabase for each environment
- **No Frontend URL Variable**: The `FRONTEND_URL` environment variable is not needed in the frontend configuration
- **Vercel JSON**: Required for proper SPA routing and authentication redirects

---

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid redirect URL" error**
   - Check Supabase URL Configuration
   - Ensure redirect URLs are properly added

2. **Password reset link not working**
   - Verify `vercel.json` is present
   - Check Vercel deployment logs

3. **Environment mismatch**
   - Confirm `.env` points to correct Supabase project
   - Verify environment-specific URLs are configured

---

## 📞 Support

For issues with URL redirection configuration:
- Check Supabase dashboard URL configuration
- Verify Vercel deployment settings
- Ensure environment variables are correctly set

**Last Updated:** October 2025
