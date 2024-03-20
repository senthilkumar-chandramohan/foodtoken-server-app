import Web3 from "web3";
import crypto from "crypto";
import { ethers } from "ethers";

let web3Instance:any = null;

const getWeb3Instance = () => {
    if (!web3Instance) {
        web3Instance = new Web3 (
            new Web3.providers.HttpProvider(process.env.POLYGON_HTTP_PROVIDER || '')
        );
    }

    return web3Instance;
};

const createWallet = () => {
    const id = crypto.randomBytes(32).toString('hex');
    const privateKey = "0x" + id;

    const wallet = new ethers.Wallet(privateKey);
    return { privateKey, wallet };
};

export {
    getWeb3Instance,
    createWallet,
};