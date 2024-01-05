import express from 'express';
import { getBalance, getTransactionHistory } from '../modules/index';
import { ACCOUNT_DETAILS_MAP } from "../utils/constants";

const router = express.Router();

// Common routes go here
router.get("/get-balance", async (req, res) => {
    const {
        query: { accID },
    } = req;
    
    if (!accID) {
        return res.status(400).json({
            error: "accountID is required",
        });
    }

    const accountID:number = parseInt(accID as string);
    const walletAddress = ACCOUNT_DETAILS_MAP[accountID].wallet;
    console.log("wallet", walletAddress);
    const balance = await getBalance(walletAddress);
    res.json({ balance: balance.toString() });
});

router.get("/get-txn-history", async (req, res) => {
    const {
        query: { accID },
    } = req;
    
    if (!accID) {
        return res.status(400).json({
            error: "accountID is required",
        });
    }

    const accountID:number = parseInt(accID as string);
    const walletAddress = ACCOUNT_DETAILS_MAP[accountID].wallet;
    console.log("wallet", walletAddress);
    const txnHistory = await getTransactionHistory(walletAddress);
    res.json({ txnHistory });
});
  
export default router;
