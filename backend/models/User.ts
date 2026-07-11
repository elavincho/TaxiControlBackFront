import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  carBrand: { type: String },
  carModel: { type: String },
  carYear: { type: Number },
  carPlate: { type: String },
  carKilometers: { type: Number },
  verified: { type: Boolean, default: true },
  avatarUrl: { type: String },
  licenciaTaxi: { type: String },
  vtvVencimiento: { type: String }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
