import mongoose from 'mongoose';

const mantenimientoSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fecha: { type: String, required: true },
  tipoMantenimiento: { type: String, required: true },
  descripcion: { type: String },
  importe: { type: Number, required: true },
  kilometrajeActual: { type: Number, required: true },
  proximoSugeridoKilometraje: { type: Number },
  proximoSugeridaFecha: { type: String },
  taller: { type: String },
  nroFactura: { type: String }
}, { timestamps: true });

export const Mantenimiento = mongoose.model('Mantenimiento', mantenimientoSchema);
