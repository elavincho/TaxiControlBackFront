import { Router } from 'express';
import { getMonotributos, createMonotributo, updateMonotributo, deleteMonotributo } from '../controllers/monotributoController';

const router = Router();

router.get('/:userId', getMonotributos);
router.post('/', createMonotributo);
router.put('/:id', updateMonotributo);
router.delete('/:id', deleteMonotributo);

export default router;
