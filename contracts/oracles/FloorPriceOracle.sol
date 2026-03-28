// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title FloorPriceOracle
 * @dev Integrates Chainlink NFT Floor Price feeds to provide valuation for MorphYield collateral.
 */
contract FloorPriceOracle is Ownable {
    // Mapping from NFT collection address to Chainlink Price Feed address
    mapping(address => address) public priceFeeds;
    
    // Heartbeat timeout for stale data (e.g., 24 hours)
    uint256 public constant STALE_TIMEOUT = 25 hours;

    event FeedUpdated(address indexed nftCollection, address indexed feed);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Sets the price feed for a specific NFT collection.
     * @param nftCollection The address of the NFT contract.
     * @param feed The address of the Chainlink Aggregator.
     */
    function setPriceFeed(address nftCollection, address feed) external onlyOwner {
        require(nftCollection != address(0), "Invalid collection");
        require(feed != address(0), "Invalid feed");
        priceFeeds[nftCollection] = feed;
        emit FeedUpdated(nftCollection, feed);
    }

    /**
     * @dev Returns the floor price of an NFT collection in 18-decimal format.
     * @param nftCollection The address of the NFT collection.
     * @return price The floor price scaled to 1e18.
     */
    function getFloorPrice(address nftCollection) public view returns (uint256) {
        address feedAddress = priceFeeds[nftCollection];
        require(feedAddress != address(0), "Feed not configured");

        AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            
        ) = feed.latestRoundData();

        require(answer > 0, "Negative price");
        require(updatedAt != 0, "Incomplete round");
        require(block.timestamp - updatedAt <= STALE_TIMEOUT, "Stale price data");

        uint8 feedDecimals = feed.decimals();
        uint256 price = uint256(answer);

        // Scale price to 18 decimals
        if (feedDecimals < 18) {
            return price * (10**(18 - feedDecimals));
        } else if (feedDecimals > 18) {
            return price / (10**(feedDecimals - 18));
        }
        
        return price;
    }

    /**
     * @dev Batch version of getFloorPrice for UI/Liquidator efficiency.
     */
    function getMultipleFloorPrices(address[] calldata collections) external view returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](collections.length);
        for (uint256 i = 0; i < collections.length; i++) {
            prices[i] = getFloorPrice(collections[i]);
        }
        return prices;
    }
}