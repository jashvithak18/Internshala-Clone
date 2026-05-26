import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import useragent from 'express-useragent';
import connectDB from './config/db.js';

// Load routers
import authRoutes from './routes/auth.js';
import friendsRoutes from './routes/friends.js';
import postsRoutes from './routes/posts.js';
import paymentsRoutes from './routes/payments.js';
import resumeRoutes from './routes/resume.js';
import languageRoutes from './routes/language.js';
import notificationsRoutes from './routes/notifications.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to your Vercel URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

// Expose Socket.IO instance on app to use in routers
app.set('io', io);

// Standard Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' })); // Higher limit for profile photos / resumes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(useragent.express());

// Basic welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Elevance Skills Internshala API Gateway' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/language', languageRoutes);
app.use('/api/notifications', notificationsRoutes);

// Socket.IO Room Coordination
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // User joins their personal room based on their MongoDB ID
  // This allows targeting notifications to specific users
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket Client joined private room: ${userId}`);
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Centralized Error Handling for 404 routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('Global Server Error:', err.message, err.stack);
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start listening
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
