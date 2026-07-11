import { Router } from 'express';
import { getMantenimientos, createMantenimiento, updateMantenimiento, deleteMantenimiento } from '../controllers/mantenimientoController';

const router = Router();

router.get('/:userId', getMantenimientos);
router.post('/', createMantenimiento);
router.put('/:id', updateMantenimiento);
router.delete('/:id', deleteMantenimiento);

export default router;
