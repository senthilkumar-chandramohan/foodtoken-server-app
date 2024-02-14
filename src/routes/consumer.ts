import express from "express";
import { sendToken } from "../modules/index";
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post("/send-token", async (req, res) => {
  const fromAccountID = req.user.uid;
  const {
    body: {
      toAccountID = '',
      toEmailID = '',
      toPhoneNumber = '',
      amount,
      note,
    },
  } = req;

  // Get both sender and receiver wallet details
  const queryWallet = await prisma.users.findMany({
    where: {
      OR: [
        { id: { equals: fromAccountID } },
        { id: { equals: toAccountID } },
        { email: { equals: toEmailID } },
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
  const fromWalletAddress = queryWallet.find(wallet => wallet.id === fromAccountID)?.walletId || '';
  // Find To Wallet address by account ID (OR) Email ID (OR) Phone Number
  const toWalletAddress = queryWallet.find(wallet => wallet.id === toAccountID || wallet.email === toEmailID || wallet.phoneNumber === toPhoneNumber)?.walletId || '';

  // Send Token
  const receipt = await sendToken(fromWalletAddress, toWalletAddress, amount, note);

  res.status(200).json(receipt);
});

export default router;
