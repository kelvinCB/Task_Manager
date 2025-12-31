require('./config/loadEnv');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');

const app = express();

// Use permissive CORS to ensure E2E works locally
app.use(cors());
app.use(express.json());

// Request logging for debugging
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const timeEntryRoutes = require('./routes/timeEntries');
const uploadRoutes = require('./routes/upload');
const profileRoutes = require('./routes/profile');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
app.use('/api/auth', authRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.send('Task Manager Backend is running!');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('SERVER_ID: DEBUG_SESSION_123'); // Unique ID for debugging
  // Keep process alive
  setInterval(() => { }, 60000);
});
