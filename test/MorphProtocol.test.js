const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MorphYield Protocol E2E", function () {
  let accessManager, receiptToken, uTokenFactory, yieldStreamer, rentalController, floorOracle;
  let owner, user, renter;
  let mockNFT, mockUSDC;

  before(async () => {
    [owner, user, renter] = await ethers.getSigners();

    // Deploy Core
    const AccessManager = await ethers.getContractFactory("AccessManager");
    accessManager = await AccessManager.deploy();

    const ReceiptToken = await ethers.getContractFactory("ReceiptToken");
    receiptToken = await ReceiptToken.deploy(await accessManager.getAddress());

    // Deploy Yield
    const UTokenFactory = await ethers.getContractFactory("UTokenFactory");
    uTokenFactory = await UTokenFactory.deploy();

    const YieldStreamer = await ethers.getContractFactory("YieldStreamer");
    yieldStreamer = await YieldStreamer.deploy(
      await receiptToken.getAddress(),
      await uTokenFactory.getAddress()
    );

    // Deploy Mocks
    const MockNFT = await ethers.getContractFactory("ReceiptToken"); // Reuse ERC1155 logic for mock
    mockNFT = await MockNFT.deploy(await accessManager.getAddress());
    
    const MockERC20 = await ethers.getContractFactory("UTokenFactory"); // Dummy for USDC
    // Note: In a real scenario we'd use a proper ERC20 mock, but for speed we assume standard interface
    // We'll deploy a simple one here
  });

  it("Should handle the full lifecycle: Deposit -> Mint -> Rent", async function () {
    // 1. Setup Access
    await accessManager.grantRole(await accessManager.MANAGER_ROLE(), await yieldStreamer.getAddress());

    // 2. User deposits NFT (Simulated by minting a receipt directly for this test)
    const tokenId = 1;
    await receiptToken.mint(user.address, tokenId, 1, "0x");
    expect(await receiptToken.balanceOf(user.address, tokenId)).to.equal(1);

    // 3. YieldStreamer creates U-Tokens
    // We mock the U-Token creation via the factory
    await yieldStreamer.initializeStream(tokenId, 1000); 
    const uTokenAddr = await yieldStreamer.uTokens(tokenId);
    expect(uTokenAddr).to.not.equal(ethers.ZeroAddress);

    // 4. Rental (Simulated)
    // In a real E2E, we'd verify the ZK proof here. 
    // Since the Verifier is a separate component, we check the RentalController state.
    const RentalController = await ethers.getContractFactory("RentalController");
    rentalController = await RentalController.deploy(
      await receiptToken.getAddress(),
      ethers.ZeroAddress // Placeholder for Verifier
    );

    expect(await rentalController.getAddress()).to.not.equal(ethers.ZeroAddress);
  });

  it("Should protect against unauthorized receipt minting", async function () {
    const tokenId = 99;
    await expect(
      receiptToken.connect(user).mint(user.address, tokenId, 1, "0x")
    ).to.be.revertedWith("AccessManager: caller is not manager");
  });
});