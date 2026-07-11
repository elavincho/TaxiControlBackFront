// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import apiRouter from './routes/index.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Cargar variables de entorno
// dotenv.config();

// const app = express();

// // Puerto - Asegurar que sea un número
// const PORT: number = parseInt(process.env.PORT || '3000', 10);

// // Configuración CORS mejorada
// const corsOptions = {
//   origin: [
//     'http://localhost:5173',
//     'http://localhost:3000',
//     'http://127.0.0.1:5173',
//     'http://127.0.0.1:3000'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// };

// // Enable CORS
// app.use(cors(corsOptions));
// app.use(express.json());

// // MongoDB connection
// const MONGODB_URI: string = (() => {
//   const uri = process.env.MONGODB_URI;
//   if (uri && uri.trim() !== '') {
//     return uri;
//   }
//   console.warn("⚠️  No MONGODB_URI found, using local fallback");
//   return "mongodb://localhost:27017/taxi-control-9";
// })();

// let dbConnected = false;

// async function connectToDatabase(): Promise<void> {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000,
//     });
//     console.log("✅ Connected to MongoDB successfully");
//     dbConnected = true;
//   } catch (err: any) {
//     console.warn("⚠️  Could not connect to MongoDB database:", err.message);
//     console.info("💡 Tip: The app will run in fallback Offline-First mode using local storage.");
//     dbConnected = false;
//   }
// }

// connectToDatabase();

// // --- MOUNT API ROUTER ---
// app.use('/api', apiRouter);

// // Health Check
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: "ok", 
//     mongodb: dbConnected ? "connected" : "disconnected",
//     database: MONGODB_URI.includes("@") ? "Remote Atlas" : "Local/Fallback"
//   });
// });

// // Ruta de prueba para verificar que el backend funciona
// app.get('/', (req, res) => {
//   res.json({ 
//     message: 'Backend is running!',
//     endpoints: {
//       health: '/api/health',
//       api: '/api'
//     }
//   });
// });

// // --- START SERVER ---
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Express server running on port ${PORT}`);
//   console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`🗄️  Database: ${MONGODB_URI.includes("@") ? 'Remote Atlas' : 'Local'}`);
//   console.log(`📁 API URL: http://localhost:${PORT}/api`);
//   console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
// });






// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import apiRouter from './routes/index.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();

// const app = express();
// const PORT = parseInt(process.env.PORT || '3000', 10);

// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/taxi-control-9";

// let dbConnected = false;

// async function connectToDatabase() {
//   try {
//     await mongoose.connect(MONGODB_URI);
//     console.log("✅ Connected to MongoDB successfully");
//     dbConnected = true;
//   } catch (err) {
//     const errorMessage = err instanceof Error ? err.message : 'Unknown error';
//     console.warn("⚠️ Could not connect to MongoDB:", errorMessage);
//     console.info("💡 Tip: The app will run in fallback Offline-First mode using local storage.");
//     dbConnected = false;
//   }
// }

// connectToDatabase();

// app.use(cors());
// app.use(express.json());

// app.use('/api', apiRouter);

// app.get('/api/health', (req, res) => {
//   res.json({
//     status: "ok",
//     mongodb: dbConnected ? "connected" : "disconnected"
//   });
// });

// // Servir el frontend en producción
// if (process.env.NODE_ENV === 'production') {
//   // La ruta correcta en Vercel
//   const frontendPath = path.join(__dirname, '../../frontend/dist');
//   console.log('📁 Serving frontend from:', frontendPath);

//   app.use(express.static(frontendPath));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(frontendPath, 'index.html'));
//   });
// }

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });


import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/taxi-control-9";

let dbConnected = false;

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
    dbConnected = true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.warn("⚠️ Could not connect to MongoDB:", errorMessage);
    dbConnected = false;
  }
}

connectToDatabase();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    mongodb: dbConnected ? "connected" : "disconnected"
  });
});

// Servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  // Busca el frontend en diferentes ubicaciones posibles
  const possiblePaths = [
    path.join(__dirname, '../../frontend/dist'),
    path.join(__dirname, '../frontend/dist'),
    path.join(__dirname, 'frontend/dist'),
    path.join(process.cwd(), 'frontend/dist')
  ];

  let frontendPath = null;
  for (const p of possiblePaths) {
    try {
      if (require('fs').existsSync(p)) {
        frontendPath = p;
        break;
      }
    } catch (e) { }
  }

  if (frontendPath) {
    console.log('📁 Serving frontend from:', frontendPath);
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.warn('⚠️ Frontend dist not found');
    app.get('*', (req, res) => {
      res.status(404).send('Frontend not found');
    });
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});