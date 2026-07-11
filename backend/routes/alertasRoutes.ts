import { Router } from 'express';
import { getAlertas, createAlerta, updateAlerta, deleteAlerta } from '../controllers/alertasController';

const router = Router();

router.get('/:userId', getAlertas);
router.post('/', createAlerta);
router.put('/:id', updateAlerta);
router.delete('/:id', deleteAlerta);

export default router;
