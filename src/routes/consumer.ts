import express from "express";
import { sendToken } from "../modules/index";
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post("/send-token", async (req, res) => {
  const fromUserId = req.user.uid;
  const {
    body: {
      toUserId = '',
      toEmailId = '',
      toPhoneNumber = '',
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
        { email: { equals: toEmailId } },
        { phoneNumber: { equals: toPhoneNumber } },
      ]
    },
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      walletId: true
    }
  });

  // Find From Wallet address by account ID
  const fromWalletAddress = queryWallet.find(wallet => wallet.id === fromUserId)?.walletId || '';
  // Find To Wallet address by userId (OR) Email ID (OR) Phone Number
  const toWalletAddress = queryWallet.find(wallet => wallet.id === toUserId || wallet.email === toEmailId || wallet.phoneNumber === toPhoneNumber)?.walletId || '';

  // Send Token
  const receipt = await sendToken(fromWalletAddress, toWalletAddress, parseFloat(amount), note);

  res.status(200).json(receipt);
});

export default router;
