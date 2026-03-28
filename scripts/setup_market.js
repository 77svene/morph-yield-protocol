const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting up market with account:", deployer.address);

  // Load deployed addresses (assuming they were saved or we fetch them)
  // In a real scenario, we'd read from a deployments.json
  // For this script, we assume the core deployment just finished
  const receiptTokenAddr = process.env.RECEIPT_TOKEN_ADDRESS;
  const uTokenFactoryAddr = process.env.UTOKEN_FACTORY_ADDRESS;
  const oracleAddr = process.env.ORACLE_ADDRESS;

  if (!receiptTokenAddr || !uTokenFactoryAddr || !oracleAddr) {
    throw new Error("Missing environment variables for contract addresses");
  }

  const receiptToken = await hre.ethers.getContractAt("ReceiptToken", receiptTokenAddr);
  const uTokenFactory = await hre.ethers.getContractAt("UTokenFactory", uTokenFactoryAddr);
  const oracle = await hre.ethers.getContractAt("FloorPriceOracle", oracleAddr);

  // 1. Setup Mock NFT Collection
  const MockNFT = await hre.ethers.getContractFactory("ReceiptToken"); // Reusing ReceiptToken as a mock NFT for simplicity
  const mockNFT = await MockNFT.deploy("Bored Ape Mock", "BAYCM");
  await mockNFT.waitForDeployment();
  const mockNFTAddr = await mockNFT.getAddress();
  console.log("Mock NFT deployed at:", mockNFTAddr);

  // 2. Set Floor Price in Oracle (e.g., 50 ETH in basis points or USDC)
  const floorPrice = hre.ethers.parseUnits("50", 18);
  const tx1 = await oracle.setFloorPrice(mockNFTAddr, floorPrice);
  await tx1.wait();
  console.log("Floor price set for collection");

  // 3. Register Collection in Factory
  const tx2 = await uTokenFactory.createUToken(mockNFTAddr, "Utility BAYC", "uBAYC");
  const receipt = await tx2.wait();
  
  // Find the UTokenCreated event
  const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'UTokenCreated');
  const uTokenAddr = event.args[1];
  console.log("U-Token created at:", uTokenAddr);

  // 4. Mint a few NFTs to the deployer for testing
  for (let i = 1; i <= 3; i++) {
    await mockNFT.mint(deployer.address, i);
    console.log(`Minted Mock NFT #${i} to deployer`);
  }

  console.log("Market setup complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});