import mongoose from 'mongoose';

const monotributoSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fechaPago: { type: String, required: true },
  importe: { type: Number, required: true },
  categoria: { type: String, required: true },
  fechaVencimiento: { type: String, required: true }
}, { timestamps: true });

export const Monotributo = mongoose.model('Monotributo', monotributoSchema);
