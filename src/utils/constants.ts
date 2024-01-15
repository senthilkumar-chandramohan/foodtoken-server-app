import path from 'path';
import fs from 'fs';
import dotenv from "dotenv";
dotenv.config();

const dirname = path.resolve();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const SYSTEM_WALLET = process.env.SYSTEM_WALLET;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const CHAIN_ID = process.env.CHAIN_ID;
const POLYGON_WS_PROVIDER = process.env.POLYGON_WS_PROVIDER;

const contractABIBuffer:Buffer = fs.readFileSync(`${dirname}\\src\\utils\\resources\\contract_abi.json`);
const CONTRACT_ABI = JSON.parse(contractABIBuffer.toString('utf-8'));

const DECIMALS = 1000000000000000000;

export {
    SYSTEM_WALLET,
    SIGNER_PRIVATE_KEY,
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
	DECIMALS,
	POLYGONSCAN_API_KEY,
	CHAIN_ID,
	POLYGON_WS_PROVIDER,
};