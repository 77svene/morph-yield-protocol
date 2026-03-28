// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/AccessManager.sol";

contract YieldStreamer is Ownable {
    AccessManager public immutable accessManager;

    struct Stream {
        address uToken;
        uint256 amountPerSecond;
        uint256 startTime;
        uint256 lastClaimTime;
        address recipient;
    }

    mapping(uint256 => Stream) public streams; // nftId => Stream
    mapping(address => uint256) public totalVested;

    event StreamCreated(uint256 indexed nftId, address uToken, uint256 rate, address recipient);
    event YieldClaimed(uint256 indexed nftId, address recipient, uint256 amount);

    constructor(address _accessManager) Ownable(msg.sender) {
        accessManager = AccessManager(_accessManager);
    }

    function createStream(
        uint256 nftId,
        address uToken,
        uint256 totalAmount,
        uint256 duration,
        address recipient
    ) external {
        require(accessManager.isMorphEngine(msg.sender), "Only engines");
        require(duration > 0, "Duration zero");
        require(streams[nftId].startTime == 0, "Stream exists");

        uint256 rate = totalAmount / duration;
        streams[nftId] = Stream({
            uToken: uToken,
            amountPerSecond: rate,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            recipient: recipient
        });

        emit StreamCreated(nftId, uToken, rate, recipient);
    }

    function claim(uint256 nftId) public {
        Stream storage stream = streams[nftId];
        require(stream.startTime != 0, "No stream");
        
        uint256 claimable = calculateClaimable(nftId);
        require(claimable > 0, "Nothing to claim");

        stream.lastClaimTime = block.timestamp;
        require(IERC20(stream.uToken).transfer(stream.recipient, claimable), "Transfer failed");

        emit YieldClaimed(nftId, stream.recipient, claimable);
    }

    function calculateClaimable(uint256 nftId) public view returns (uint256) {
        Stream memory stream = streams[nftId];
        if (stream.startTime == 0) return 0;
        
        uint256 timePassed = block.timestamp - stream.lastClaimTime;
        return timePassed * stream.amountPerSecond;
    }

    function stopStream(uint256 nftId) external {
        require(accessManager.isMorphEngine(msg.sender), "Only engines");
        if (calculateClaimable(nftId) > 0) {
            claim(nftId);
        }
        delete streams[nftId];
    }
}