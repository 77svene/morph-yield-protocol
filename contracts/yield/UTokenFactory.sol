// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, address initialOwner) 
        ERC20(name, symbol) 
        Ownable(initialOwner) 
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

contract UTokenFactory is Ownable {
    struct Vault {
        address nftAddress;
        uint256 tokenId;
        address uToken;
        address owner;
        bool active;
    }

    mapping(address => mapping(uint256 => Vault)) public vaults;
    uint256 public constant FRACTION_SUPPLY = 1000 * 10**18;

    event UTokenCreated(address indexed nftAddress, uint256 indexed tokenId, address uToken);
    event NFTReleased(address indexed nftAddress, uint256 indexed tokenId, address receiver);

    constructor() Ownable(msg.sender) {}

    function createUToken(address nftAddress, uint256 tokenId, string calldata name, string calldata symbol) external returns (address) {
        require(vaults[nftAddress][tokenId].uToken == address(0), "Already fractionalized");
        
        // Lock NFT in this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);

        // Deploy U-Token
        UToken uToken = new UToken(name, symbol, address(this));
        
        vaults[nftAddress][tokenId] = Vault({
            nftAddress: nftAddress,
            tokenId: tokenId,
            uToken: address(uToken),
            owner: msg.sender,
            active: true
        });

        // Mint fractions to the owner
        uToken.mint(msg.sender, FRACTION_SUPPLY);

        emit UTokenCreated(nftAddress, tokenId, address(uToken));
        return address(uToken);
    }

    function redeemNFT(address nftAddress, uint256 tokenId) external {
        Vault storage vault = vaults[nftAddress][tokenId];
        require(vault.active, "Vault not active");
        require(vault.owner == msg.sender, "Not vault owner");

        UToken uToken = UToken(vault.uToken);
        // Require all fractions to be returned to unlock the NFT
        uToken.burn(msg.sender, FRACTION_SUPPLY);

        vault.active = false;
        IERC721(nftAddress).transferFrom(address(this), msg.sender, tokenId);

        emit NFTReleased(nftAddress, tokenId, msg.sender);
    }
}