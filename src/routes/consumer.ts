import express from "express";
import { sendToken } from "../modules/index";
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post("/send-token", async (req, res) => {
    const {
      body: {
        fromAccountID,
        toAccountID,
        amount,
        note,
      },
    } = req;

    // Get both sender and receiver wallet details
    const queryWallet = await prisma.user.findMany({
      where: {
        id: { in: [fromAccountID, toAccountID]}
      },
      select: {
        id: true,
        walletId: true
      }
    });

    const fromWalletAddress = queryWallet.find(wallet => wallet.id === fromAccountID)?.walletId || '';
    const toWalletAddress = queryWallet.find(wallet => wallet.id === toAccountID)?.walletId || '';
    const receipt = await sendToken(fromWalletAddress, toWalletAddress, amount, note);
    res.status(200).json(receipt);
  });

export default router;
