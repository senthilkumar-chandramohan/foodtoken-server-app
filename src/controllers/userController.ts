import codes from "country-calling-code";
import ip3country from "ip3country";
import { createWallet } from "../utils";
import { PrismaClient } from "@prisma/client";

import { provideTransferPermissionToSystemAccount, mintTokens } from "../modules/contract-interaction";

const prisma = new PrismaClient();
ip3country.init();

const createAccount = async (req:any, res:any) => {
  const {
    clientIp: ip = '',
    user: {
      uid,
      name,
      email,
      picture,
    },
    body: {
      phoneNumber,
    }
  } = req;

  const country = ip3country.lookupStr(ip) || 'US';
  const callingCode = codes.find(code=>code.isoCode2 === country)?.countryCodes[0];

  const firstName = name.split(' ')[0];
  const lastName = name.split(' ')[1];
  const { privateKey, wallet } = createWallet();
  // const { address } = wallet;

  provideTransferPermissionToSystemAccount(wallet);
  // mintTokens(address, 100000); // logic moved

  const insertUser = await prisma.users.create({
    data: {
      id: uid,
      phoneNumber: callingCode + phoneNumber,
      email,
      picture,
      firstName,
      lastName,
      walletId: wallet.address,
      privateKey,
    }
  });

  console.log(insertUser);

  if (insertUser) {
    res.status(200).json({ country });  
  } else {
    res.status(404).send();
  }
}

const loginUser = async (req: any, res: any) => {
  const {
    clientIp: ip = '',
    user: {
      uid,
    },
  } = req;
  
  console.log(req.user);

  const queryUser = await prisma.users.findUnique({
    where: {
      id: uid as string
    },
    select: {
      id: true
    }
  });

  // console.log(queryUser);
  console.log("IP of the user", ip);
  console.log("Country of the user", ip3country.lookupStr(ip));

  if (queryUser?.id) {

    const country = ip3country.lookupStr(ip) || 'US';
    res.status(200).json({ country });  
  } else {
    res.status(404).send();
  }
}

export {
  createAccount,
  loginUser,
};
