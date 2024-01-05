import express from "express";
import { sendToken } from "../modules/index";
import { ACCOUNT_DETAILS_MAP } from "../utils/constants";

const router = express.Router();

router.post("/send-token", async (req, res) => {
    const {
      body: {
        fromAccountID,
        toAccountID,
        amount,
        note,
      },
    } = req;
  
    const fromWalletAddress = ACCOUNT_DETAILS_MAP[fromAccountID].wallet;
    const toWalletAddress = ACCOUNT_DETAILS_MAP[toAccountID].wallet;
  
    console.log("fromWallet", fromWalletAddress);
    console.log("toWallet", toWalletAddress);
  
    const receipt = await sendToken(fromWalletAddress, toWalletAddress, amount, note);
    res.json(receipt);
  });

export default router;
