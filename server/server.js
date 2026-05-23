const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');
const requestRoutes = require('./routes/requestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { isMock } = require('./config/firebase');

const app = express();
const server = http.createServer(app);

// Configure CORS for Next.js dev server
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Socket.IO Server
const io = socketIo(server, {
  cors: corsOptions
});

// Initialize Socket.IO handlers & export the active broadcaster
const socketHandler = require('./sockets/socketHandler')(io);
app.set('socketHandler', socketHandler);

// Wire API Routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Premium Welcome & API Documentation Dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GeoTeam API Engine</title>
      <style>
        body {
          margin: 0;
          font-family: 'Inter', -apple-system, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          color: #f8fafc;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          box-sizing: border-box;
        }
        .card {
          background: rgba(30, 41, 59, 0.45);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 1.5rem;
        }
        .logo {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.5rem;
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }
        .title {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(to right, #ffffff, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .status-ok {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-mock {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: currentColor;
          animation: pulse 1.5s infinite;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .section {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .section-title {
          font-weight: 700;
          font-size: 1rem;
          color: #c084fc;
          margin-top: 0;
          margin-bottom: 0.75rem;
        }
        ul {
          margin: 0;
          padding-left: 1.2rem;
          font-size: 0.9rem;
          color: #cbd5e1;
          line-height: 1.6;
        }
        li {
          margin-bottom: 0.5rem;
        }
        code {
          background: rgba(255, 255, 255, 0.08);
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.85rem;
          color: #f472b6;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">GT</div>
          <div>
            <h1 class="title">GeoTeam Realtime API Engine</h1>
            <div class="status-badge ${isMock ? 'status-mock' : 'status-ok'}">
              <span class="indicator"></span>
              <span>Database Status: ${isMock ? 'In-Memory Mock Active (Zero Config Mode)' : 'Production Firebase Connected'}</span>
            </div>
          </div>
        </div>
        
        <p style="color: #94a3b8; line-height: 1.6; margin-top: 0;">
          Welcome to the high-performance backend server for <strong>GeoTeam</strong>. The server coordinates authentication, 
          performs geospatial calculations (bounding boxes + Haversine formula) for nearby teams, handles Socket.IO sessions, 
          and tracks collaborative chats.
        </p>

        <div class="grid">
          <div class="section">
            <h2 class="section-title">Auth Endpoints</h2>
            <ul>
              <li><code>POST /api/auth/register</code> - Register</li>
              <li><code>POST /api/auth/login</code> - Login</li>
              <li><code>GET /api/auth/me</code> - Session profile</li>
              <li><code>PUT /api/auth/profile</code> - Edit profile</li>
            </ul>
          </div>
          <div class="section">
            <h2 class="section-title">Team Finder</h2>
            <ul>
              <li><code>POST /api/polls/create</code> - Create Team Poll</li>
              <li><code>GET /api/polls/nearby</code> - Query (needs <code>radius</code>)</li>
              <li><code>GET /api/polls/:id</code> - Detailed project node</li>
            </ul>
          </div>
          <div class="section">
            <h2 class="section-title">Join Flow</h2>
            <ul>
              <li><code>POST /api/requests/join</code> - Request</li>
              <li><code>POST /api/requests/respond/:id</code> - Owner Accept</li>
              <li><code>GET /api/requests/poll/:id</code> - View list</li>
            </ul>
          </div>
          <div class="section">
            <h2 class="section-title">Chat & Live alerts</h2>
            <ul>
              <li><code>GET /api/chat/rooms</code> - Access rooms</li>
              <li><code>GET /api/chat/messages/:id</code> - Message history</li>
              <li>Socket Connection: <code>ws://localhost:5000</code></li>
            </ul>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 GeoTeam API Server booted on Port ${PORT}`);
  console.log(`🌐 Health dashboard: http://localhost:${PORT}`);
  console.log(`🔥 Database state: ${isMock ? 'InMemoryMock' : 'FirebaseFirestore'}`);
  console.log(`=================================================`);
});
