import { Request, Response } from 'express';
import { GastoCombustible } from '../models';

export const getCombustibles = async (req: Request, res: Response) => {
  try {
    const cargas = await GastoCombustible.find({ userId: req.params.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(cargas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createCombustible = async (req: Request, res: Response) => {
  try {
    const carga = await GastoCombustible.create(req.body);
    res.status(201).json(carga);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCombustible = async (req: Request, res: Response) => {
  try {
    const updated = await GastoCombustible.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Gasto de combustible no encontrado' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCombustible = async (req: Request, res: Response) => {
  try {
    await GastoCombustible.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
