import { Request, Response } from 'express';
import { Mantenimiento } from '../models';

export const getMantenimientos = async (req: Request, res: Response) => {
  try {
    const logs = await Mantenimiento.find({ userId: req.params.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMantenimiento = async (req: Request, res: Response) => {
  try {
    const log = await Mantenimiento.create(req.body);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMantenimiento = async (req: Request, res: Response) => {
  try {
    const updated = await Mantenimiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Mantenimiento no encontrado' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMantenimiento = async (req: Request, res: Response) => {
  try {
    await Mantenimiento.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
