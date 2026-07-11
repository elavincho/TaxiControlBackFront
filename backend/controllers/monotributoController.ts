import { Request, Response } from 'express';
import { Monotributo } from '../models';

export const getMonotributos = async (req: Request, res: Response) => {
  try {
    const records = await Monotributo.find({ userId: req.params.userId }).sort({ fechaPago: -1 });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMonotributo = async (req: Request, res: Response) => {
  try {
    const record = await Monotributo.create(req.body);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateMonotributo = async (req: Request, res: Response) => {
  try {
    const actualizado = await Monotributo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(actualizado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteMonotributo = async (req: Request, res: Response) => {
  try {
    await Monotributo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
