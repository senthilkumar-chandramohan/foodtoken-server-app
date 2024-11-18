import express from "express";
import { sendToken } from "../modules/index";
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get("/sellers", async (req, res) => {
  const {
    query: {
      value = '',
    },
    user: {
      uid,
    }
  } = req;

  const querySellers = await prisma.users.findMany({
    where: {
      OR: [
        { email: { startsWith: value as string } },
        { phoneNumber: { startsWith: value as string } },
      ],
      AND: [
        { id: { not: uid as string} }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      picture: true,
      email: true,
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

  const receipt = await sendToken(fromWalletAddress, toWalletAddress, amount);
  if (receipt) {
    res.status(200).json(receipt);
  } else {
    res.status(500).send();
  }
});

export default router;
