import { Router } from 'express';
import { getViajes, createViaje, updateViaje, deleteViaje } from '../controllers/viajesController';

const router = Router();

router.get('/:userId', getViajes);
router.post('/', createViaje);
router.put('/:id', updateViaje);
router.delete('/:id', deleteViaje);

export default router;
