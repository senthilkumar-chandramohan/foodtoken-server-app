import express from "express";
import webPush from "web-push";
import { PrismaClient } from "@prisma/client";

import { getBalance, getTransactionHistory } from '../modules/index';
import { createAccount, loginUser } from "../controllers";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/signup", async (req, res) => {
  createAccount(req, res);
});

router.get("/login", async (req, res) => {
  loginUser(req, res);
});

router.get("/token-balance", async (req, res) => {
  const {
    uid
  } = req.user;

  const queryWallet = await prisma.users.findUnique({
    where: {
      id: uid as string
    },
    select: {
      walletId: true
    }
  });

  const walletAddress: string = queryWallet?.walletId || '';
  const balance = await getBalance(walletAddress);

  res.status(200).json({ balance: balance.toString() });
});

router.get("/txn-history", async (req, res) => {
  const {
    uid
  } = req.user;

  const queryWallet = await prisma.users.findUnique({
    where: {
      id: uid as string
    },
    select: {
      walletId: true
    }
  });

  const walletAddress: string = queryWallet?.walletId || '';
  const txnHistory = await getTransactionHistory(walletAddress);

  res.status(200).json({ txnHistory });
});

router.get("/app-server-key", async (req, res) => {
  const {
    uid
  } = req.user;

  const queryVapidKeys = await prisma.users.findUnique({
    where: {
      id: uid as string
    },
    select: {
      vapidKeys: true
    }
  });

  let vapidKeys: any = queryVapidKeys?.vapidKeys;

  if (!vapidKeys) {
    vapidKeys = webPush.generateVAPIDKeys();
    const result = await prisma.users.update({
      where: {
        id: uid as string
      },
      data: {
        vapidKeys: vapidKeys
      }
    });
  }

  const { publicKey } = vapidKeys;  
  res.json({ publicKey });
});

router.post("/subscription", async (req, res) => {
  const {
    body,
  } = req;

  const {
    uid
  } = req.user;

  const result: any = await prisma.users.update({
    where: {
      id: uid as string
    },
    data: {
      subscription: body
    }
  });

  const {
    vapidKeys: {
      publicKey,
      privateKey,
    }
  } = result;
  
  webPush.setVapidDetails(
    'mailto:your-email@example.com',
    publicKey,
    privateKey
  );

  const payload = JSON.stringify({ title: 'Push Notification Test' });
  webPush.sendNotification(body, payload)
    .catch(error => console.error(error));

  res.json({status: 'success'});
});
  
export default router;
