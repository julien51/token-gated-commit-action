const ethers = require("ethers");

/**
 * RPC Providers
 */
const providers = {
  1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  4: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  10: "https://mainnet.optimism.io",
  56: "https://bsc-dataseed.binance.org/",
  137: "https://rpc-mainnet.maticvigil.com/",
  100: "https://rpc.xdaichain.com/",
};

/**
 * hasValidKey
 * @param {*} userAddress
 * @param {*} lockAddress
 * @param {*} network
 * @returns
 */
const hasValidKey = async (userAddress, lockAddress, network) => {
  const provider = new ethers.providers.JsonRpcProvider(providers[network]);
  const lock = new ethers.Contract(
    lockAddress,
    ["function getHasValidKey(address _owner) constant view returns (bool)"],
    provider
  );

  return lock.getHasValidKey(userAddress);
};

/**
 *
 * @param {*} signature
 * @param {*} message
 * @param {*} locks
 * @returns
 */
const authorized = async (signature, message, locks) => {
  const signerAddress = ethers.utils.verifyMessage(message, signature);

  const results = await Promise.all(
    locks.map((lock) => hasValidKey(signerAddress, lock.address, lock.network))
  );

  return !!results.find((x) => x);
};

module.exports = {
  authorized,
};
