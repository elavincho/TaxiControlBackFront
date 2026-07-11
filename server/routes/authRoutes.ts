import { Router } from 'express';
import { register, login, getProfile, updateProfile, deleteProfile } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.delete('/:userId', deleteProfile);

export default router;
