const { ethers } = require("hardhat");

/**
 * MorphYield StateSyncer
 * Syncs off-chain NFT metadata hashes to the RentalController for ZK-verification.
 */
class StateSyncer {
    constructor(rentalControllerAddress, signer) {
        this.rentalControllerAddress = rentalControllerAddress;
        this.signer = signer;
        this.abi = [
            "function updateMetadataHash(address nftAddress, uint256 tokenId, bytes32 newHash) external",
            "function getMetadataHash(address nftAddress, uint256 tokenId) external view returns (bytes32)"
        ];
        this.contract = new ethers.Contract(rentalControllerAddress, this.abi, signer);
    }

    /**
     * Simulates fetching metadata from an external source (IPFS/API)
     * and computing a Poseidon-compatible hash for the ZK circuit.
     */
    async fetchAndHashMetadata(nftAddress, tokenId) {
        // In a real scenario, we'd fetch from IPFS gateway
        // For MVP, we simulate state drift or consistency
        const timestamp = Math.floor(Date.now() / 10000); // Coarse window
        const mockMetadata = `NFT:${nftAddress}:${tokenId}:${timestamp}`;
        return ethers.keccak256(ethers.toUtf8Bytes(mockMetadata));
    }

    async syncState(nftAddress, tokenId) {
        try {
            console.log(`[StateSyncer] Syncing state for ${nftAddress} #${tokenId}...`);
            
            const newHash = await this.fetchAndHashMetadata(nftAddress, tokenId);
            const currentHash = await this.contract.getMetadataHash(nftAddress, tokenId);

            if (newHash !== currentHash) {
                console.log(`[StateSyncer] Drift detected. Updating hash to ${newHash}`);
                const tx = await this.contract.updateMetadataHash(nftAddress, tokenId, newHash);
                await tx.wait();
                console.log(`[StateSyncer] Successfully synced hash in tx: ${tx.hash}`);
                return true;
            } else {
                console.log(`[StateSyncer] State is already in sync.`);
                return false;
            }
        } catch (error) {
            console.error(`[StateSyncer] Sync failed:`, error.message);
            throw error;
        }
    }
}

// Health check / CLI runner
if (require.main === module) {
    async function main() {
        const [deployer] = await ethers.getSigners();
        // Placeholder address for demonstration - in production this is passed via env
        const RENTAL_CONTROLLER = process.env.RENTAL_CONTROLLER_ADDR || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const syncer = new StateSyncer(RENTAL_CONTROLLER, deployer);
        
        console.log("StateSyncer service started.");
        // Example sync
        await syncer.syncState("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", 1);
    }

    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = StateSyncer;