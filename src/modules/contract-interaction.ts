import dotenv from "dotenv";
import { getWeb3Instance, getBigNumber, constants } from "../utils/index";

dotenv.config();

const sendToken = async (sender:string, receiver:string, amount:number, note:string) => {
    const web3 = getWeb3Instance();

    const contract = new web3.eth.Contract(
        constants.CONTRACT_ABI,
        constants.CONTRACT_ADDRESS,
    );

    const amountBN = getBigNumber(amount).mul(getBigNumber(constants.DECIMALS));
    console.log(amountBN);

    const txn = contract.methods.transferFrom(sender, receiver, amountBN);
    const gas = await txn.estimateGas({ from: constants.SYSTEM_WALLET });
    const gasPrice = await web3.eth.getGasPrice();
    const data = txn.encodeABI();
    const nonce = await web3.eth.getTransactionCount(constants.SYSTEM_WALLET);

    console.log('\n gas:', gas);
    console.log('\n gasPrice:', gasPrice);
    console.log('\n nonce:', nonce);

    const signedTxn = await web3.eth.accounts.signTransaction({
        to: contract.options.address,
        data,
        gas,
        gasPrice,
        nonce,
        chainId: 5,
    }, constants.PRIVATE_KEY);

    const receipt = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);
    return receipt;
};

const getBalance = async (address:string) => {
    const web3 = getWeb3Instance();
    const {
        CONTRACT_ABI,
        CONTRACT_ADDRESS,
        DECIMALS,
    } = constants;
    
    if (!web3.utils.isAddress(address)) {
        throw new Error("Invalid address");
    }

    const contract = new web3.eth.Contract(
        CONTRACT_ABI,
        CONTRACT_ADDRESS,
    );

    const balance = await contract.methods.balanceOf(address).call();
    return balance/BigInt(DECIMALS);
};

const getTransactionHistory = async (address:string) => {
    const apiKey="VVCPGMJQZ2IZ2FQUT7K79HS2K4SEA6AVB9";
    const reqUrl=`https://api-goerli.etherscan.io/api?module=account&action=tokentx&address=${address}&sort=desc&apikey=${apiKey}`;

    const response = await fetch(reqUrl, { method: 'GET' });
    const responseJSON = await response.json();

    const {
        WALLET_NAME_MAP,
        DECIMALS,
    } = constants;

    const filteredResponse = responseJSON.result.map((transaction:any) => {
        const {
            timeStamp,
            to,
            value,
            hash,
        } = transaction;

        const txnType = to === address.toLowerCase() ? "CREDIT" : "PAYMENT";
        const txnTo = WALLET_NAME_MAP[to];

        return {
            timeStamp,
            txnType,
            to: txnTo,
            value: value/DECIMALS,
            hash,
        };
    });

    return filteredResponse;
};

export {
    sendToken,
    getBalance,
    getTransactionHistory,
};
