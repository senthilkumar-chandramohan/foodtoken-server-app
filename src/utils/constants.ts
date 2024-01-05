// import CONTRACT_JSON from "./resources/MetaCoin.json" assert { type: "json" };
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const dirname = path.resolve();
console.log(dirname)

const CONTRACT_ADDRESS = "0x984Fc7F05A24Cb8FE4f3E3067452F1cE74379B3a";
const SYSTEM_WALLET = '0xb83E6644Dc27CBfE9e4F6Bd5128dCAcc419b86Db';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '98aef9b63894fae74ac3818e3c987391e75114688644841e2c405fdc9d0ca2df';

const accountDataBuffer:Buffer = fs.readFileSync(`${dirname}\\src\\utils\\resources\\account_details_map.json`);
const ACCOUNT_DETAILS_MAP = JSON.parse(accountDataBuffer.toString('utf-8'));

const contractABIBuffer:Buffer = fs.readFileSync(`${dirname}\\src\\utils\\resources\\contract_abi.json`);
const CONTRACT_ABI = JSON.parse(contractABIBuffer.toString('utf-8'));

const WALLET_NAME_MAP:any = {
	"0x257eba064f5e16216a97b450340ea7b4f9f30d20": "Senthil Catering Service",
	"0xc063b54128a263d4e1231accc600b20559122ee4": "Shobana S"
};

const WALLET_ACCOUNT_ID_MAP = {
	"0x257eBa064F5e16216A97B450340eA7b4F9f30D20": "9962589489",
	"0xC063B54128a263D4e1231aCcc600B20559122ee4": "9940213539"
};

const DECIMALS = 1000000000000000000;

export {
    SYSTEM_WALLET,
    PRIVATE_KEY,
    // CONTRACT_JSON,
    ACCOUNT_DETAILS_MAP,
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
	WALLET_NAME_MAP,
	DECIMALS,
	WALLET_ACCOUNT_ID_MAP,
};