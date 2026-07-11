import { Request, Response } from 'express';
import { Viaje } from '../models';

export const getViajes = async (req: Request, res: Response) => {
  try {
    const viajes = await Viaje.find({ userId: req.params.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(viajes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createViaje = async (req: Request, res: Response) => {
  try {
    const nuevoViaje = await Viaje.create(req.body);
    res.status(201).json(nuevoViaje);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateViaje = async (req: Request, res: Response) => {
  try {
    const updated = await Viaje.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteViaje = async (req: Request, res: Response) => {
  try {
    await Viaje.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
