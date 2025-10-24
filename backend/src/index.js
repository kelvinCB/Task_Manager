require('./config/loadEnv');

const express = require('express');
const cors = require('cors');

const app = express();

// Configure CORS for production
// Normalize allowed origins and allow localhost in dev
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g. https://task-manager-llwv.vercel.app (no trailing slash)
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const normalize = (url) => (url ? url.replace(/\/$/, '') : url);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin and non-browser clients
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalize(origin);
    const isAllowed = allowedOrigins.some((o) => normalize(o) === normalizedOrigin);
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('Task Manager Backend is running!');
});

// Health check endpoint for Render
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
});
