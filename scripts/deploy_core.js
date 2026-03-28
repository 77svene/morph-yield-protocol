const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MorphYield Core with account:", deployer.address);

  const registryPath = path.join(__dirname, `../deployments_${network.name}.json`);
  let registry = {};
  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  }

  async function deployOrAttach(name, factory, args = []) {
    if (registry[name]) {
      console.log(`Using existing ${name} at ${registry[name]}`);
      return await ethers.getContractAt(name, registry[name]);
    }
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`${name} deployed to: ${addr}`);
    registry[name] = addr;
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    return contract;
  }

  // 1. AccessManager
  const AccessManager = await ethers.getContractFactory("AccessManager");
  const access = await deployOrAttach("AccessManager", AccessManager);

  // 2. ReceiptToken (ERC1155)
  const ReceiptToken = await ethers.getContractFactory("ReceiptToken");
  const receipt = await deployOrAttach("ReceiptToken", ReceiptToken, [access.target]);

  // 3. UTokenFactory
  const UTokenFactory = await ethers.getContractFactory("UTokenFactory");
  const factory = await deployOrAttach("UTokenFactory", UTokenFactory, [access.target]);

  // 4. YieldStreamer
  const YieldStreamer = await ethers.getContractFactory("YieldStreamer");
  const streamer = await deployOrAttach("YieldStreamer", YieldStreamer, [factory.target, access.target]);

  // 5. LeaseVerifier (ZK)
  const LeaseVerifier = await ethers.getContractFactory("LeaseVerifier");
  const verifier = await deployOrAttach("LeaseVerifier", LeaseVerifier);

  // 6. RentalController
  const RentalController = await ethers.getContractFactory("RentalController");
  const rental = await deployOrAttach("RentalController", RentalController, [
    receipt.target,
    streamer.target,
    verifier.target,
    access.target
  ]);

  // 7. Oracle Integration (Chainlink Sepolia ETH/USD as proxy for floor)
  // In production, this would be the specific NFT collection floor feed
  const chainlinkEthUsdSepolia = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  const FloorPriceOracle = await ethers.getContractFactory("FloorPriceOracle");
  const oracle = await deployOrAttach("FloorPriceOracle", FloorPriceOracle, [chainlinkEthUsdSepolia]);

  console.log("--- Linkage & Verification Phase ---");

  // Grant Roles
  const MINTER_ROLE = await receipt.MINTER_ROLE();
  if (!(await receipt.hasRole(MINTER_ROLE, streamer.target))) {
    console.log("Granting MINTER_ROLE to Streamer...");
    const tx = await receipt.grantRole(MINTER_ROLE, streamer.target);
    await tx.wait();
  }

  // Verify Linkage
  const isMinter = await receipt.hasRole(MINTER_ROLE, streamer.target);
  if (!isMinter) throw new Error("Linkage Verification Failed: Streamer not Minter");

  const currentStreamer = await factory.streamer();
  if (currentStreamer !== streamer.target) {
    console.log("Setting Streamer in Factory...");
    const tx = await factory.setStreamer(streamer.target);
    await tx.wait();
  }

  const verifiedStreamer = await factory.streamer();
  if (verifiedStreamer !== streamer.target) throw new Error("Linkage Verification Failed: Factory streamer mismatch");

  console.log("MorphYield Core Deployment & Linkage Complete.");
  console.log(registry);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });