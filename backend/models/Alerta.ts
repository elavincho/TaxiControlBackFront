import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tipo: { type: String, required: true },
  mensaje: { type: String, required: true },
  fechaLimite: { type: String },
  kmLimite: { type: Number },
  resuelta: { type: Boolean, default: false }
}, { timestamps: true });

export const Alerta = mongoose.model('Alerta', alertaSchema);
