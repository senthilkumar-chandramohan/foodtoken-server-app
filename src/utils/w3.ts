import Web3 from 'web3';

let web3Instance:any = null;

const getWeb3Instance = () => {
    if (!web3Instance) {
        const network = process.env.ETHEREUM_NETWORK || "goerli";
        web3Instance = new Web3(
            new Web3.providers.HttpProvider (
                `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
            )
        );
    }

    return web3Instance;
};

const getBigNumber = (number:number) => {
    const web3 = getWeb3Instance();
    return web3.utils.toBN(number);
};

export {
    getWeb3Instance,
    getBigNumber,
};