// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../core/AccessManager.sol";
import "./LeaseVerifier.sol";

/**
 * @title RentalController
 * @dev Manages active rental states and utility access.
 * Users burn U-Tokens to secure a lease period.
 */
contract RentalController {
    AccessManager public immutable accessManager;
    LeaseVerifier public immutable verifier;

    struct RentalState {
        address renter;
        uint256 expiry;
        bytes32 stateHash; // Hash of NFT state at start of rental
    }

    // nftAddress => tokenId => RentalState
    mapping(address => mapping(uint256 => RentalState)) public activeRentals;

    event RentalStarted(address indexed nftAddress, uint256 indexed tokenId, address indexed renter, uint256 expiry);
    event RentalEnded(address indexed nftAddress, uint256 indexed tokenId);

    constructor(address _accessManager, address _verifier) {
        require(_accessManager != address(0), "Invalid access manager");
        require(_verifier != address(0), "Invalid verifier");
        accessManager = AccessManager(_accessManager);
        verifier = LeaseVerifier(_verifier);
    }

    /**
     * @dev Start a rental by burning U-Tokens.
     * @param nftAddress The NFT contract address.
     * @param tokenId The specific NFT ID.
     * @param duration Duration in seconds.
     * @param uToken The address of the U-Token being burned.
     * @param amount Amount of U-Tokens to burn (rate-based).
     */
    function rent(
        address nftAddress,
        uint256 tokenId,
        uint256 duration,
        address uToken,
        uint256 amount
    ) external {
        require(duration > 0, "Duration must be > 0");
        require(activeRentals[nftAddress][tokenId].expiry < block.timestamp, "Already rented");
        
        // In a real scenario, we'd verify the uToken is linked to this specific NFT
        // For MVP, we assume the caller provides the correct token.
        bool success = IERC20(uToken).transferFrom(msg.sender, address(0xdead), amount);
        require(success, "Burn failed");

        activeRentals[nftAddress][tokenId] = RentalState({
            renter: msg.sender,
            expiry: block.timestamp + duration,
            stateHash: bytes32(0) // Initialized, updated via ZK-Attestor later
        });

        emit RentalStarted(nftAddress, tokenId, msg.sender, block.timestamp + duration);
    }

    /**
     * @dev Validates if a user has active utility rights.
     * Used by RentalRelay or external gaming engines.
     */
    function isRenter(address nftAddress, uint256 tokenId, address user) external view returns (bool) {
        RentalState memory lease = activeRentals[nftAddress][tokenId];
        return (lease.renter == user && lease.expiry > block.timestamp);
    }

    /**
     * @dev Allows the verifier to update the state hash after a ZK-proof check.
     */
    function updateStateHash(address nftAddress, uint256 tokenId, bytes32 newStateHash) external {
        require(msg.sender == address(verifier), "Only verifier");
        activeRentals[nftAddress][tokenId].stateHash = newStateHash;
    }
}