import { Request, Response } from 'express';
import { Seguro } from '../models';

export const getSeguros = async (req: Request, res: Response) => {
  try {
    const records = await Seguro.find({ userId: req.params.userId }).sort({ fechaPago: -1 });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createSeguro = async (req: Request, res: Response) => {
  try {
    const record = await Seguro.create(req.body);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSeguro = async (req: Request, res: Response) => {
  try {
    const actualizado = await Seguro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(actualizado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSeguro = async (req: Request, res: Response) => {
  try {
    await Seguro.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
