import { PrismaClient } from '@prisma/client';
import { Wallet, ethers } from "ethers";
import { splitSignature } from "ethers/lib/utils.js";

import { getWeb3Instance, constants } from "../utils/index";

const prisma = new PrismaClient();

const sendToken = async (sender:string, receiver:string, amount:string, note:string) => {
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

    const amountWei = web3.utils.toWei(amount);
    const txn = contract.methods.transferFrom(sender, receiver, amountWei);
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
            lastName: true,
            picture: true,
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
            ...(txnType === TRANSACTION_TYPE.CREDIT && {from: { name: fromWallet?.firstName + ' ' + fromWallet?.lastName, picture: fromWallet?.picture}}),
            ...(txnType === TRANSACTION_TYPE.DEBIT && {to: { name: toWallet?.firstName + ' ' + toWallet?.lastName, picture: toWallet?.picture}}),
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

const provideTransferPermissionToSystemAccount = async (wallet:Wallet) => {
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

  const web3 = getWeb3Instance();

  console.log("web3 instance created");

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
  const gasPrice = await web3.eth.getGasPrice();
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

  const receipt = await web3.eth.sendSignedTransaction(signedTxn.rawTransaction);
  console.log(receipt);
  console.log("owner address: ", ownerAddress);
  mintTokens(ownerAddress, 1000);
}

const mintTokens = async (address: any, amount: any) => {
  const {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
    DECIMALS,
    CHAIN_ID,
    SIGNER_PRIVATE_KEY,
  } = constants;

  try {
    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY || '');
    const web3 = getWeb3Instance();

    console.log("Web3 instance", web3);

    const chainId = CHAIN_ID;
    const contract = new web3.eth.Contract (
      CONTRACT_ABI,
      CONTRACT_ADDRESS,
    );

    const amountWei = web3.utils.toWei(amount);
    const txn = contract.methods.mint(address, amountWei);
    const gas = await txn.estimateGas({ from: signer.address });
    const gasPrice = await web3.eth.getGasPrice();
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
    console.log(receipt);
  } catch (err: any) {
  }
}

export {
    sendToken,
    getBalance,
    getTransactionHistory,
    provideTransferPermissionToSystemAccount,
    mintTokens,
};
