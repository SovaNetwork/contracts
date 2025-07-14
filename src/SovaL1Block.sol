// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/auth/Ownable.sol";

import "./interfaces/ISovaL1Block.sol";

/**
 * @custom:proxied true
 * @custom:predeploy 0x2100000000000000000000000000000000000015
 *
 * @title SovaL1Block
 * @author Sova Labs
 *
 * SovaL1Block provides information about the state of the Bitcoin chain.
 * Values stored in this contract are used by validators to verify block execution.
 * The primary values used here are the Bitcoin block height and trailing block hash.
 */
contract SovaL1Block is ISovaL1Block, Ownable {
    uint64 private currentBlockHeight;
    bytes32 private blockHashSixBlocksBack;
    uint256 private lastUpdatedBlock;

    address private constant SYSTEM_ACCOUNT_ADDRESS = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;

    constructor() Ownable() {
        _initializeOwner(msg.sender);
    }

    function version() external pure virtual returns (string memory) {
        return "0.1.0-beta.1";
    }

    function setBitcoinBlockData(uint64 _blockHeight, bytes32 _blockHash) external {
        require(msg.sender == owner(), "SovaL1Block: only the chain admin can set block data");

        currentBlockHeight = _blockHeight;
        blockHashSixBlocksBack = _blockHash;
        lastUpdatedBlock = block.number;
    }
}
