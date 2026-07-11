import { Request, Response } from 'express';
import { Alerta } from '../models';

export const getAlertas = async (req: Request, res: Response) => {
  try {
    const alertas = await Alerta.find({ userId: req.params.userId }).sort({ fechaLimite: 1 });
    res.json(alertas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createAlerta = async (req: Request, res: Response) => {
  try {
    const alerta = await Alerta.create(req.body);
    res.status(201).json(alerta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAlerta = async (req: Request, res: Response) => {
  try {
    const actualizada = await Alerta.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizada) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(actualizada);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAlerta = async (req: Request, res: Response) => {
  try {
    await Alerta.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
