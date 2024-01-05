import express from 'express';
import authRoutes from './auth';
import merchantRoutes from './merchant';
import consumerRoutes from './consumer';
import commonRoutes from './common';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/merchant', merchantRoutes);
router.use('/consumer', consumerRoutes);
router.use('/common', commonRoutes);

export default router;
