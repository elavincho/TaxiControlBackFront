import { Router } from 'express';
import { getSeguros, createSeguro, updateSeguro, deleteSeguro } from '../controllers/seguroController';

const router = Router();

router.get('/:userId', getSeguros);
router.post('/', createSeguro);
router.put('/:id', updateSeguro);
router.delete('/:id', deleteSeguro);

export default router;
