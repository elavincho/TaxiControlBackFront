import mongoose from 'mongoose';

const gastoCombustibleSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fecha: { type: String, required: true },
  importe: { type: Number, required: true },
  nota: { type: String },
  tipo: { type: String, enum: ['GNC', 'Nafta'], required: true }
}, { timestamps: true });

export const GastoCombustible = mongoose.model('GastoCombustible', gastoCombustibleSchema);
