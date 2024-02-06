import { getWeb3Instance, getBigNumber, constants } from "../utils/index";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sendToken = async (sender:string, receiver:string, amount:number, note:string) => {
    const web3 = getWeb3Instance();

    const {
        CONTRACT_ABI,
        CONTRACT_ADDRESS,
        DECIMALS,
        SYSTEM_WALLET,
        CHAIN_ID,
        SIGNER_PRIVATE_KEY,
    } = constants;

    const contract = new web3.eth.Contract(
        CONTRACT_ABI,
        CONTRACT_ADDRESS,
    );

    const amountBN = getBigNumber(amount).mul(getBigNumber(DECIMALS));
    const txn = contract.methods.transferFrom(sender, receiver, amountBN);
    const gas = await txn.estimateGas({ from: SYSTEM_WALLET });
    const gasPrice = await web3.eth.getGasPrice();
    const data = txn.encodeABI();
    const nonce = await web3.eth.getTransactionCount(SYSTEM_WALLET);
    const chainId = CHAIN_ID;

    const signedTxn = await web3.eth.accounts.signTransaction({
        to: contract.options.address,
        data,
        gas,
        gasPrice,
        nonce,
        chainId,
    }, SIGNER_PRIVATE_KEY);

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
    return balance/DECIMALS;
};

const getTransactionHistory = async (address:string) => {
    const {
        DECIMALS,
        POLYGONSCAN_API_KEY,
        TRANSACTION_TYPE,
    } = constants;

    const apiKey = POLYGONSCAN_API_KEY;
    const reqUrl=`https://api-testnet.polygonscan.com/api?module=account&action=tokentx&address=${address}&sort=desc&apikey=${apiKey}`;

    const response = await fetch(reqUrl, { method: 'GET' });
    const responseJSON = await response.json();

    const allTxnWallets = [
        ...responseJSON.result.map((transaction:any) => transaction.to),
        ...responseJSON.result.map((transaction:any) => transaction.from)
    ];

    const walletIDNameMap = await prisma.users.findMany({
        where: {
            walletId: {
                in: allTxnWallets,
                mode: 'insensitive'
            }
        },
        select: {
            walletId: true,
            firstName: true,
            lastName: true
        }
    });

    const filteredResponse = responseJSON.result.map((transaction:any) => {
        const {
            timeStamp,
            from,
            to,
            value,
            hash,
        } = transaction;

        const txnType = to === address.toLowerCase() ? TRANSACTION_TYPE.CREDIT : TRANSACTION_TYPE.DEBIT;
        const fromWallet = walletIDNameMap.find(wallet=>wallet.walletId.toLowerCase() === from.toLowerCase());
        const toWallet = walletIDNameMap.find(wallet=>wallet.walletId.toLowerCase() === to.toLowerCase());

        return {
            timeStamp,
            txnType,
            ...(txnType === TRANSACTION_TYPE.CREDIT && {from: fromWallet?.firstName + ' ' + fromWallet?.lastName}),
            ...(txnType === TRANSACTION_TYPE.DEBIT && {to: toWallet?.firstName + ' ' + toWallet?.lastName}),
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
