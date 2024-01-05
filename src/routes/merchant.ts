import express from 'express';

const router = express.Router();

// Merchant routes go here
router.get('/hello', (req, res) => {
    res.send('Hello Merchant!');
});

export default router;
