import { ethers } from "ethers";
import webPush from "web-push";
import { PrismaClient } from "@prisma/client";
import { constants } from "../utils/index";

const prisma = new PrismaClient();

(async () => {
    const {
        POLYGON_WS_PROVIDER,
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
    } = constants;

    const provider = new ethers.providers.WebSocketProvider(POLYGON_WS_PROVIDER || "");
    const contract = new ethers.Contract(CONTRACT_ADDRESS || "", CONTRACT_ABI, provider);

    contract.on("Transfer", async (from, to, value, event) => {
        let info = {
            from,
            to,
            value: ethers.utils.formatUnits(value, 18),
            data: event,
        };

        // console.log(JSON.stringify(info, null, 4));

        const wallets = await prisma.users.findMany({
            where: {
                walletId: {
                    in: [to, from],
                    mode: 'insensitive'
                }
            },
            select: {
                walletId: true,
                vapidKeys: true,
                subscription: true,
                firstName: true,
                lastName: true,
            }
        });

        const fromWallet: any = wallets.find(wallet=>wallet.walletId.toLowerCase() === from.toLowerCase());
        const toWallet: any = wallets.find(wallet=>wallet.walletId.toLowerCase() === to.toLowerCase());

        const {
            vapidKeys,
            subscription,
        } = toWallet;
        
        webPush.setVapidDetails(
            "mailto:your-email@example.com",
            vapidKeys.publicKey,
            vapidKeys.privateKey
          );

        const payload = JSON.stringify({
            title: `You have received ₹${ethers.utils.formatUnits(value, 18)}`,
            body: `from ${fromWallet?.firstName}`,
            icon: 'test.png'
        });

        webPush.sendNotification(subscription, payload)
            .catch((error: any) => console.error(error));
    });
    console.log("Started listening for Transfer events...");
})();