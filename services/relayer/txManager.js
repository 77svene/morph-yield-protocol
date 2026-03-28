const { ethers } = require("ethers");
require("dotenv").config();

/**
 * TxManager handles blockchain interactions for the relayer.
 * It abstracts gas costs by using a funded relayer wallet.
 */
class TxManager {
    constructor() {
        this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
        this.privateKey = process.env.RELAYER_PRIVATE_KEY;
        this.rentalControllerAddress = process.env.RENTAL_CONTROLLER_ADDRESS;

        if (!this.privateKey) {
            throw new Error("RELAYER_PRIVATE_KEY not found in environment");
        }

        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        
        // Minimal ABI for RentalController.rent function
        this.abi = [
            "function rent(uint256 tokenId, uint256 duration, bytes calldata proof) external"
        ];
    }

    /**
     * Relays a rent transaction to the blockchain.
     * @param {string} tokenId - The NFT Receipt ID.
     * @param {number} duration - Rental duration in seconds.
     * @param {string} proof - The ZK-proof hex string.
     */
    async relayRent(tokenId, duration, proof) {
        try {
            const contract = new ethers.Contract(
                this.rentalControllerAddress,
                this.abi,
                this.wallet
            );

            console.log(`Relaying rent for token ${tokenId}...`);

            // Estimate gas to ensure it won't fail immediately
            const gasLimit = await contract.rent.estimateGas(tokenId, duration, proof);
            
            // Execute transaction
            const tx = await contract.rent(tokenId, duration, proof, {
                gasLimit: (gasLimit * 120n) / 100n // 20% buffer
            });

            console.log(`Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            
            if (receipt.status === 0) {
                throw new Error("Transaction reverted on-chain");
            }

            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error("Relay failed:", error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getRelayerBalance() {
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers.formatEther(balance);
    }
}

module.exports = new TxManager();