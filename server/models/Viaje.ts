import mongoose from 'mongoose';

const viajeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fecha: { type: String, required: true }, // YYYY-MM-DD
  formaPago: { type: String, required: true },
  monto: { type: Number, required: true }
}, { timestamps: true });

export const Viaje = mongoose.model('Viaje', viajeSchema);
