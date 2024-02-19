import express from "express";
import { sendToken } from "../modules/index";
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get("/sellers", async (req, res) => {
  const {
    value = '',
  } = req.query;

  const querySellers = await prisma.users.findMany({
    where: {
      OR: [
        { email: { startsWith: value as string } },
        { phoneNumber: { startsWith: value as string } },
      ]
    },
    select: {
      id: true,
      firstName: true,
    }
  });

  res.status(200).json(querySellers);
});

router.post("/token", async (req, res) => {
  const fromUserId = req.user.uid;
  const {
    body: {
      toUserId = '',
      amount,
      note,
    },
  } = req;

  // Get both sender and receiver wallet details
  const queryWallet = await prisma.users.findMany({
    where: {
      OR: [
        { id: { equals: fromUserId } },
        { id: { equals: toUserId } },
      ]
    },
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      walletId: true
    }
  });

  // Find From address
  const fromWalletAddress = queryWallet.find(wallet => wallet.id === fromUserId)?.walletId || '';
  // Find To address
  const toWalletAddress = queryWallet.find(wallet => wallet.id === toUserId)?.walletId || '';

  // Send Token
  if (!fromWalletAddress) {
    res.status(400).json({"error": "Error, please sign-in and try again!"});
  }

  if (!toWalletAddress) {
    res.status(400).json({"error": "Error, seller doesn't exist, please try again!"});
  } 

  const receipt = await sendToken(fromWalletAddress, toWalletAddress, parseFloat(amount), note);
  res.status(200).json(receipt);
});

export default router;
