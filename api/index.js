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
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.warn("⚠️ Could not connect to MongoDB:", errorMessage);
        console.info("💡 Tip: The app will run in fallback Offline-First mode using local storage.");
        dbConnected = false;
    }
}
connectToDatabase();
app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);
app.get('/api/health', (req, res) => {
    res.json({
        status: "ok",
        mongodb: dbConnected ? "connected" : "disconnected"
    });
});
// Servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map