import express from 'express';
import { getBalance, getTransactionHistory } from '../modules/index';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Common routes go here
router.get("/get-balance", async (req, res) => {
    const {
        query: { accountID },
    } = req;
    
    if (!accountID) {
        return res.status(400).json({
            error: "accountID is required",
        });
    }

    const queryWallet = await prisma.user.findUnique({
        where: {
            id: accountID as string
        },
        select: {
            walletId: true
        }
    });
    const walletAddress: string = queryWallet?.walletId || '';

    console.log("wallet", walletAddress);
    const balance = await getBalance(walletAddress);
    res.status(200).json({ balance: balance.toString() });
});

router.get("/get-txn-history", async (req, res) => {
    const {
        query: { accountID },
    } = req;
    
    if (!accountID) {
        return res.status(400).json({
            error: "accountID is required",
        });
    }

    const queryWallet = await prisma.user.findUnique({
        where: {
            id: accountID as string
        },
        select: {
            walletId: true
        }
    });

    const walletAddress: string = queryWallet?.walletId || '';
    const txnHistory = await getTransactionHistory(walletAddress);

    res.status(200).json({ txnHistory });
});
  
export default router;
