import { Request, Response } from 'express';
import { User, Viaje, GastoCombustible, Mantenimiento, Alerta, Monotributo, Seguro } from '../models';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, username, passwordHash, carBrand, carModel, carYear, carPlate, carKilometers } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario o correo electrónico ya se encuentra registrado.' });
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      username,
      passwordHash,
      carBrand,
      carModel,
      carYear,
      carPlate,
      carKilometers: carKilometers || 0,
      verified: true,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
    });

    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, passwordHash } = req.body;

    const matchedUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, 'i') } },
        { email: { $regex: new RegExp(`^${identifier}$`, 'i') } }
      ]
    });

    if (!matchedUser) {
      return res.status(404).json({ error: 'Usuario o correo electrónico no registrado.' });
    }

    if (matchedUser.passwordHash !== passwordHash) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    res.json(matchedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.userId, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndDelete(userId);
    await Viaje.deleteMany({ userId });
    await GastoCombustible.deleteMany({ userId });
    await Mantenimiento.deleteMany({ userId });
    await Alerta.deleteMany({ userId });
    await Monotributo.deleteMany({ userId });
    await Seguro.deleteMany({ userId });
    res.json({ message: 'Usuario y todos sus registros asociados eliminados con éxito' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
