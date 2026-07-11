import { Router } from 'express';
import { getCombustibles, createCombustible, updateCombustible, deleteCombustible } from '../controllers/combustibleController';

const router = Router();

router.get('/:userId', getCombustibles);
router.post('/', createCombustible);
router.put('/:id', updateCombustible);
router.delete('/:id', deleteCombustible);

export default router;
