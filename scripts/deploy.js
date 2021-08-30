// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { getConfig, setConfig } = require('./config.js')
const { network } = require('hardhat');
async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  console.log(network.name)
  const BassTransaction = await ethers.getContractFactory("BassTransaction");
  const [deployer] = await ethers.getSigners();
  const alice = await deployer.getAddress();
  console.log(
    "Deploying the contracts on " + network.name + " with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  if (
    getConfig() &&
    getConfig().deployed &&
    getConfig().deployed[network.name]?.BassTransaction) {
    bassTransaction = await upgrades.upgradeProxy(
      getConfig().deployed[network.name]?.BassTransaction,
      BassTransaction, ["https://ipfs.io/ipfs/{hash}", alice]
    )
    console.log('bassTransaction:', bassTransaction.address)
  } else {
    bassTransaction = await upgrades.deployProxy(
      BassTransaction, ["https://ipfs.io/ipfs/{hash}", alice]
    )
  }
  await bassTransaction.deployed();
  setConfig('deployed.' + network.name + '.BassTransaction', bassTransaction.address)
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
