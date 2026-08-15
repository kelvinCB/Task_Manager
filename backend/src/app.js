require('./config/loadEnv');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const { isSupabaseConfigured, isServiceRoleConfigured } = require('./config/supabaseClient');

const app = express();


// Use permissive CORS to ensure E2E works locally
app.use(cors());
app.use(express.json());

// Optional Swagger setup (Development only)
if (process.env.NODE_ENV !== 'production') {
    try {
        const swaggerUi = require('swagger-ui-express');
        const swaggerSpecs = require('./config/swagger');
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
    } catch (err) {
        console.warn('Failed to initialize Swagger docs:', err.message);
    }
}
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const timeEntryRoutes = require('./routes/timeEntries');
const uploadRoutes = require('./routes/upload');
const profileRoutes = require('./routes/profile');
const aiRoutes = require('./routes/ai');
const featureRequestRoutes = require('./routes/featureRequests');
const adminRoutes = require('./routes/admin');
const personalAccessTokenRoutes = require('./routes/personalAccessTokens');

app.use('/api/auth', authRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feature-requests', featureRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/personal-access-tokens', personalAccessTokenRoutes);

app.get('/', (req, res) => {
    res.send('Task Manager Backend is running!');
});

app.get('/health', (req, res) => {
    const configured = isSupabaseConfigured;
    res.status(configured ? 200 : 503).json({
        status: configured ? 'healthy' : 'degraded',
        supabase: configured ? 'configured' : 'missing_environment',
        personal_access_tokens: isServiceRoleConfigured ? 'configured' : 'missing_secret_key',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = app;
