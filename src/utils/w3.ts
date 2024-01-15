import Web3 from 'web3';

let web3Instance:any = null;

const getWeb3Instance = () => {
    if (!web3Instance) {
        web3Instance = new Web3 (
            new Web3.providers.HttpProvider(process.env.POLYGON_HTTP_PROVIDER || '')
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