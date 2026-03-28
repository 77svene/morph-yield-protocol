// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LeaseVerifier
 * @dev Validates rental rights using EIP-712 signatures from authorized relayers.
 * This ensures that a renter has a valid, time-bound right to use an NFT's utility.
 */
contract LeaseVerifier is Ownable {
    using ECDSA for bytes32;

    struct LeaseProof {
        address renter;
        address nftAddress;
        uint256 tokenId;
        uint256 expiration;
        bytes signature;
    }

    bytes32 public constant LEASE_TYPEHASH = keccak256(
        "Lease(address renter,address nftAddress,uint256 tokenId,uint256 expiration)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;

    mapping(address => bool) public authorizedRelayers;

    event RelayerStatusChanged(address indexed relayer, bool status);

    constructor() Ownable(msg.sender) {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("MorphYield"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Authorizes or revokes a relayer's ability to sign lease proofs.
     */
    function setRelayerStatus(address relayer, bool status) external onlyOwner {
        require(relayer != address(0), "Invalid relayer address");
        authorizedRelayers[relayer] = status;
        emit RelayerStatusChanged(relayer, status);
    }

    /**
     * @dev Verifies that the lease proof is valid, signed by an authorized relayer, and not expired.
     * @param proof The LeaseProof struct containing lease details and signature.
     * @return bool True if the proof is valid.
     */
    function verifyLease(LeaseProof calldata proof) external view returns (bool) {
        if (block.timestamp > proof.expiration) {
            return false;
        }

        bytes32 structHash = keccak256(
            abi.encode(
                LEASE_TYPEHASH,
                proof.renter,
                proof.nftAddress,
                proof.tokenId,
                proof.expiration
            )
        );

        bytes32 hash = MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
        address signer = hash.recover(proof.signature);

        return authorizedRelayers[signer];
    }

    /**
     * @dev Helper to check if a specific renter currently holds valid rights.
     */
    function isRenterValid(
        address renter,
        address nftAddress,
        uint256 tokenId,
        LeaseProof calldata proof
    ) external view returns (bool) {
        require(proof.renter == renter, "Renter mismatch");
        require(proof.nftAddress == nftAddress, "NFT address mismatch");
        require(proof.tokenId == tokenId, "Token ID mismatch");
        
        return this.verifyLease(proof);
    }
}