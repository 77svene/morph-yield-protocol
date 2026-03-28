// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReceiptToken
 * @dev ERC1155 token representing fractionalized rights of deposited NFTs.
 * ID % 2 == 0: Ownership Rights (Principal)
 * ID % 2 == 1: Utility Rights (Yield/Rental)
 */
contract ReceiptToken is ERC1155, Ownable {
    mapping(uint256 => address) public underlyingAsset;
    mapping(uint256 => uint256) public underlyingTokenId;

    constructor() ERC1155("https://api.morphyield.io/metadata/{id}") Ownable(msg.sender) {}

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        _mint(to, id, amount, data);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyOwner {
        _burn(from, id, amount);
    }

    function setUnderlying(uint256 id, address asset, uint256 tokenId) external onlyOwner {
        underlyingAsset[id] = asset;
        underlyingTokenId[id] = tokenId;
    }
}