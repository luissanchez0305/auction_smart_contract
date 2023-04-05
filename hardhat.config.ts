import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require('dotenv').config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        runs: 100,
        enabled: true
      }
    }
  },
  networks: {
	  hardhat: {},
	  ETH_MAINNET: {
		  accounts: [`${process.env.PRIVATE_KEY}`],
		  url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
	  },
	  ETH_GOERLI: {
		  accounts: [`${process.env.PRIVATE_KEY}`],
		  url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
	  }
  },
  etherscan: {
	  apiKey: `${process.env.ETHERSCAN_API_KEY}`
  },
  paths: { tests: "tests" }

};

export default config;