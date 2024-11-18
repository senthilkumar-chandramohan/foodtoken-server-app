import { PrismaClient } from '@prisma/client';
import { Wallet, ethers } from "ethers";
import { splitSignature } from "ethers/lib/utils.js";

import { getWeb3Instance, constants } from "../utils/index";

const prisma = new PrismaClient();

const sendToken = async (sender:string, receiver:string, amount:string, recurrence:number = 0) => {
  const recurrenceLimit = 5 // Number of times you want to retry
  console.log(recurrence);
  if (recurrence>=recurrenceLimit) {
    return null;
  }

  const gasIncrementStep = 0.5;
  const gasPremium = 1 + (gasIncrementStep * recurrence);

  try {
    const web3 = getWeb3Instance();

    const {
        CONTRACT_ABI,
        CONTRACT_ADDRESS,
        SYSTEM_WALLET,
        CHAIN_ID,
        SIGNER_PRIVATE_KEY,
    } = constants;

    const contract = new web3.eth.Contract(
        CONTRACT_ABI,
        CONTRACT_ADDRESS,
    );

    const amountWei = web3.utils.toWei(amount);
    const txn = contract.methods.transferFrom(sender, receiver, amountWei);
    const gas = await txn.estimateGas({ from: SYSTEM_WALLET }); // To improve mining chances
    const gasPrice = await web3.eth.getGasPrice() * gasPremium;
    const data = txn.encodeABI();
    const nonce = await web3.eth.getTransactionCount(SYSTEM_WALLET);
    const chainId = CHAIN_ID;

    console.log(`Executing txn with gas: ${gas}, premium: ${gasPremium}`);

    const signedTxn = await web3.eth.accounts.signTransaction({
        to: contract.options.address,
        data,
        gas,
        gasPrice,
        nonce,
        chainId,
    }, SIGNER_PRIVATE_KEY);

    return await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);
  }
  catch(exp) {
    console.log(exp);
    // Calling sendToken() recursively
    return sendToken(sender, receiver, amount, ++recurrence);
  }
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
        OKLINK_API_KEY,
        TRANSACTION_TYPE,
    } = constants;

    const apiKey = OKLINK_API_KEY;
    //const reqUrl=`https://api-testnet.polygonscan.com/api?module=account&action=tokentx&address=${address}&sort=desc&apikey=${apiKey}`;
    const reqUrl=`https://www.oklink.com/api/v5/explorer/address/transaction-list?chainShortName=amoy_testnet&address=${address}&limit=100`;
    console.log(reqUrl);

    const response = await fetch(reqUrl, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Ok-Access-Key': `${apiKey}`
      }});

    // console.log(response);
    const responseJSON = await response.json();
    console.log(responseJSON);

    // TODO: Optimize below code
    const allTxnWallets = [
        ...responseJSON.data[0].transactionLists.map((transaction:any) => transaction.to),
        ...responseJSON.data[0].transactionLists.map((transaction:any) => transaction.from)
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
            lastName: true,
            picture: true,
        }
    });

    const filteredResponse = responseJSON.data[0].transactionLists.map((transaction:any) => {
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
            ...(txnType === TRANSACTION_TYPE.CREDIT && {secondParty: { name: fromWallet?.firstName + ' ' + fromWallet?.lastName, picture: fromWallet?.picture}}),
            ...(txnType === TRANSACTION_TYPE.DEBIT && {secondParty: { name: toWallet?.firstName + ' ' + toWallet?.lastName, picture: toWallet?.picture}}),
            value: value/DECIMALS,
            hash,
        };
    });

    return filteredResponse;
};

const _getPermitSignature = async (
  wallet: any,
  spender: any,
  value: any,
  deadline: any,
  contractAddress: any,
  permitConfig: any,
) => {
  const {
      nonce,
      name,
      version,
      chainId
  } = permitConfig;

  return splitSignature (
    await wallet._signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: contractAddress,
      },
      {
        Permit: [
          {
            name: 'owner',
            type: 'address',
          },
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'value',
            type: 'uint256',
          },
          {
            name: 'nonce',
            type: 'uint256',
          },
          {
            name: 'deadline',
            type: 'uint256',
          },
        ],
      },
      {
        owner: wallet.address,
        spender,
        value,
        nonce,
        deadline,
      }
    )
  );
}

const provideTransferPermissionToSystemAccount = async (wallet:Wallet, recurrence:number = 0) => {
  const recurrenceLimit = 5 // Number of times you want to retry
  console.log(recurrence);
  if (recurrence>=recurrenceLimit) {
    return;
  }

  const gasIncrementStep = 0.5;
  const gasPremium = 1 + (gasIncrementStep * recurrence);

  const {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
    CHAIN_ID,
    SIGNER_PRIVATE_KEY,
  } = constants;

  const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY || '');
  const ownerAddress = wallet.address;
  const spenderAddress = signer.address;
  const value = ethers.constants.MaxUint256; // Unlimited balance
  const nonce = 0; // Setting to 0 since Permit is executed only once for a wallet
  const deadline = ethers.constants.MaxUint256; // Unlimited timeframe

  try {
    const web3 = getWeb3Instance();

    // console.log("web3 instance created");

    const abi = CONTRACT_ABI;
    const chainId = CHAIN_ID;
    const name = "FoodToken";
    const version = "1";

    const permitConfig = {
        nonce,
        name,
        version,
        chainId,
    };

    const contractAddress = CONTRACT_ADDRESS;
    const permitSignature = await _getPermitSignature(wallet, spenderAddress, value, deadline, contractAddress, permitConfig);

    const { v, r, s } = permitSignature;

    // Call Permit method in contract
    const contract = new web3.eth.Contract(
        abi,
        contractAddress,
    );

    const txn = contract.methods.permit(ownerAddress, spenderAddress, value, deadline, v, r, s);
    const gas = await txn.estimateGas({ from: signer.address });
    const gasPrice = await web3.eth.getGasPrice() * gasPremium;
    const data = txn.encodeABI();
    const accountNonce = await web3.eth.getTransactionCount(signer.address);

    const signedTxn = await web3.eth.accounts.signTransaction({
        to: contract.options.address,
        data,
        gas,
        gasPrice,
        nonce: accountNonce,
        chainId,
    }, process.env.SIGNER_PRIVATE_KEY);

    await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);
    // console.log(receipt);
    console.log("owner address: ", ownerAddress);
    setTimeout(() => {
      mintTokens(ownerAddress, "99999"); // Mint tokens after 10s
    }, 10000);
  } catch(exp) {
    console.log(exp);
    // Calling provideTransferPermissionToSystemAccount() recursively
    provideTransferPermissionToSystemAccount(wallet, ++recurrence);
  }
}

const mintTokens = async (address: string, amount: string, recurrence:number = 0) => {
  const recurrenceLimit = 5 // Number of times you want to retry
  console.log(recurrence);
  if (recurrence>=recurrenceLimit) {
    return;
  }

  const gasIncrementStep = 0.5;
  const gasPremium = 1 + (gasIncrementStep * recurrence);

  const {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
    CHAIN_ID,
    SIGNER_PRIVATE_KEY,
  } = constants;

  try {
    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY || '');
    const web3 = getWeb3Instance();

    const chainId = CHAIN_ID;
    const contract = new web3.eth.Contract (
      CONTRACT_ABI,
      CONTRACT_ADDRESS,
    );

    const amountWei = web3.utils.toWei(amount);
    const txn = contract.methods.mint(address, amountWei);
    const gas = await txn.estimateGas({ from: signer.address });
    const gasPrice = await web3.eth.getGasPrice() * gasPremium;
    const data = txn.encodeABI();
    const nonce = await web3.eth.getTransactionCount(signer.address);
    
    const signedTxn = await web3.eth.accounts.signTransaction({
        to: contract.options.address,
        data,
        gas,
        gasPrice,
        nonce,
        chainId,
    }, process.env.SIGNER_PRIVATE_KEY);

    const receipt = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);
    console.log(`${amount} tokens minted!`);
    console.log(receipt);
  } catch(exp) {
    console.log(exp);
    // Calling mintTokens() recursively
    mintTokens(address, amount, ++recurrence);
  }
}

export {
    sendToken,
    getBalance,
    getTransactionHistory,
    provideTransferPermissionToSystemAccount,
    mintTokens,
};
