import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const app = express();

// Puerto - Asegurar que sea un número
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Configuración CORS mejorada
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Enable CORS
app.use(cors(corsOptions));
app.use(express.json());

// MongoDB connection
const MONGODB_URI: string = (() => {
  const uri = process.env.MONGODB_URI;
  if (uri && uri.trim() !== '') {
    return uri;
  }
  console.warn("⚠️  No MONGODB_URI found, using local fallback");
  return "mongodb://localhost:27017/taxi-control-9";
})();

let dbConnected = false;

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB successfully");
    dbConnected = true;
  } catch (err: any) {
    console.warn("⚠️  Could not connect to MongoDB database:", err.message);
    console.info("💡 Tip: The app will run in fallback Offline-First mode using local storage.");
    dbConnected = false;
  }
}

connectToDatabase();

// --- MOUNT API ROUTER ---
app.use('/api', apiRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: "ok", 
    mongodb: dbConnected ? "connected" : "disconnected",
    database: MONGODB_URI.includes("@") ? "Remote Atlas" : "Local/Fallback"
  });
});

// Ruta de prueba para verificar que el backend funciona
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is running!',
    endpoints: {
      health: '/api/health',
      api: '/api'
    }
  });
});

// --- START SERVER ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${MONGODB_URI.includes("@") ? 'Remote Atlas' : 'Local'}`);
  console.log(`📁 API URL: http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});