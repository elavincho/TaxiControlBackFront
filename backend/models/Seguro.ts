import mongoose from 'mongoose';

const seguroSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fechaPago: { type: String, required: true },
  importe: { type: Number, required: true },
  fechaVencimiento: { type: String, required: true },
  aseguradora: { type: String }
}, { timestamps: true });

export const Seguro = mongoose.model('Seguro', seguroSchema);
