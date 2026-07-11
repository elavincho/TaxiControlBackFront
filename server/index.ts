// import express from 'express';
// import path from 'path';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import { createServer as createViteServer } from 'vite';
// import { User, Viaje, GastoCombustible, Mantenimiento, Alerta } from './models';
// import apiRouter from './routes';

// dotenv.config();

// const app = express();
// const PORT = 3000;

// // Enable CORS middleware for all routes
// app.use(cors());
// app.use(express.json());

// // MongoDB connection with fallback warning
// let MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI || MONGODB_URI.trim() === "") {
//   MONGODB_URI = "mongodb://localhost:27017/taxi-control-9";
// }

// let dbConnected = false;

// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     console.log("✅ Connected to MongoDB successfully");
//     dbConnected = true;
//     seedDemoData();
//   })
//   .catch((err) => {
//     console.warn("⚠️  Could not connect to MongoDB database:", err.message);
//     console.info("💡 Tip: The app will run in fallback Offline-First mode using local storage. To use persistent cloud database storage, set your MONGODB_URI (e.g., MongoDB Atlas) under Settings -> Secrets.");
//   });

// // --- DEMO DATA SEEDER ---
// async function seedDemoData() {
//   console.log("🌱 Database seeding skipped (requested by user to clear pre-loaded data).");
// }

// // --- MOUNT API ROUTER ---
// app.use('/api', apiRouter);

// // Health Check & DB Status (Keep legacy for verification)
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: "ok", 
//     mongodb: dbConnected ? "connected" : "disconnected",
//     database: MONGODB_URI.includes("@") ? "Remote Atlas" : "Local/Fallback"
//   });
// });

// // --- VITE MIDDLEWARE CONFIGURATION ---
// async function startServer() {
//   if (process.env.NODE_ENV !== "production") {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: "spa",
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distPath = path.join(process.cwd(), 'dist');
//     app.use(express.static(distPath));
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(distPath, 'index.html'));
//     });
//   }

//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`🚀 Express MVC server running on port ${PORT}`);
//   });
// }

// startServer();

import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { User, Viaje, GastoCombustible, Mantenimiento, Alerta } from './models';
import apiRouter from './routes';

// Cargar variables de entorno ANTES de cualquier otra configuración
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS middleware for all routes
app.use(cors());
app.use(express.json());

// MongoDB connection with fallback warning
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.trim() === "") {
  MONGODB_URI = "mongodb://localhost:27017/taxi-control-9";
  console.warn("⚠️  No MONGODB_URI found, using local fallback");
}

let dbConnected = false;

// Función para conectar a MongoDB con reintentos
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Opciones para mejor compatibilidad
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB successfully");
    dbConnected = true;
    // No llamar a seedDemoData aquí
  } catch (err: any) {
    console.warn("⚠️  Could not connect to MongoDB database:", err.message);
    console.info("💡 Tip: The app will run in fallback Offline-First mode using local storage.");
    dbConnected = false;
  }
}

// Conectar a la base de datos
connectToDatabase();

// --- DEMO DATA SEEDER (opcional) ---
async function seedDemoData() {
  console.log("🌱 Database seeding skipped (requested by user to clear pre-loaded data).");
}

// --- MOUNT API ROUTER ---
app.use('/api', apiRouter);

// Health Check & DB Status
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    mongodb: dbConnected ? "connected" : "disconnected",
    database: MONGODB_URI.includes("@") ? "Remote Atlas" : "Local/Fallback"
  });
});

// --- VITE MIDDLEWARE CONFIGURATION ---
async function startServer() {
  // En producción, servir archivos estáticos
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // En desarrollo, usar Vite middleware
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (error) {
      console.error("Error loading Vite middleware:", error);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express MVC server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${MONGODB_URI.includes("@") ? 'Remote Atlas' : 'Local'}`);
  });
}

startServer();