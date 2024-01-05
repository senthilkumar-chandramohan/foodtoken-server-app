import ethers from "ethers";
import dotenv from 'dotenv';
import webPush from 'web-push';
import { constants } from '../utils/index.js';

dotenv.config();

(async () => {
    const network = process.env.ETHEREUM_NETWORK || "goerli";
    const provider = new ethers.providers.WebSocketProvider(
        `wss://${network}.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
    );

    const contract = new ethers.Contract(constants.CONTRACT_ADDRESS, constants.CONTRACT_ABI, provider);
    contract.on("Transfer", (from, to, value, event) => {
        let info = {
            from,
            to,
            value: ethers.utils.formatUnits(value, 18),
            data: event,
        };

        console.log(JSON.stringify(info, null, 4));

        const accountID = constants.WALLET_ACCOUNT_ID_MAP[to];
        console.log("accountID", accountID);
        const subscription = constants.ACCOUNT_DETAILS_MAP[accountID].subscription;
        console.log("subscription", subscription);

        const vapidKeys = constants.ACCOUNT_DETAILS_MAP[accountID].vapidKeys;
        
        console.log("vapidKeys", vapidKeys);
        webPush.setVapidDetails(
            'mailto:your-email@example.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
          );

        const fromName = constants.WALLET_NAME_MAP[from.toLowerCase()];
        const payload = JSON.stringify({
            title: `You have received ₹${ethers.utils.formatUnits(value, 18)}`,
            body: `from ${fromName}`,
            icon: 'test.png'
        });

        webPush.sendNotification(subscription, payload)
            .catch(error => console.error(error));
    });
    console.log("Started listening for Transfer events...");
})();