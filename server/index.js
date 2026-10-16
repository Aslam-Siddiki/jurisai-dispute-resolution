require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const invitationRoutes = require('./routes/invitationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jurisai';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const { registerClient, broadcast } = require('./services/realtime');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/disputes', caseRoutes); // Compatibility alias
app.use('/api/invitations', invitationRoutes);

// Realtime Server-Sent Events (SSE) Stream
app.get('/api/realtime/events', (req, res) => {
  registerClient(req, res);
});

// Relay broadcast from microservices (e.g., Python AI engine)
app.post('/api/realtime/broadcast', (req, res) => {
  const { event = 'CASE_UPDATED', data = {} } = req.body;
  broadcast(event, data);
  res.json({ success: true, event });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'JurisAI MERN Core API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'JurisAI MERN Core API is running. API endpoints located at /api.'
  });
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[MONGODB] Connected successfully to ${MONGODB_URI}`);

    app.listen(PORT, () => {
      console.log(`[JURISAI SERVER] MERN backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[MONGODB ERROR] Connection failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
