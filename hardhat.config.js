require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
 
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks:{
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: 32_000_000,
      blockGasLimit: 32_000_000,
      gasPrice: 2000,
      initialBaseFeePerGas: 1
    } ,
    BSCTest:{
        url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
        chainId: 97,
        gase: "auto",
        accounts: [`45f93e7a6cf774228519708aa97529a9ce2a663e26e67f183fe49bb9c90d468d`]
    } 
  },
  mocha:{
    timeout: 900000000,
  },
  solidity: "0.6.12",
  settings: {
    optimizer: {
      enabled: true,
      runs:200
    },
    evmVersion: "byzantium"
  }
};
