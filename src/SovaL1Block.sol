// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "./interfaces/ISovaL1Block.sol";

/**
 * @title SovaL1Block
 * @author Sova Labs
 *
 * SovaL1Block provides information about the last known Bitcoin block. Values
 * within this contract are updated prior to Sova block execution and can
 * only be set by the system account.
 *
 * @custom:predeploy 0x2100000000000000000000000000000000000015
 */
contract SovaL1Block is ISovaL1Block {
    uint64 private currentBlockHeight;
    bytes32 private blockHashSixBlocksBack;
    uint256 private lastUpdatedBlock;

    function version() public pure virtual returns (string memory) {
        return "0.1.0-beta.1";
    }

    function SYSTEM_ACCOUNT() public pure returns (address addr_) {
        addr_ = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;
    }

    function setBitcoinBlockData(uint64 _blockHeight, bytes32 _blockHash) external {
        require(msg.sender == SYSTEM_ACCOUNT(), "BitcoinBlock: only the system account can set block data");

        currentBlockHeight = _blockHeight;
        blockHashSixBlocksBack = _blockHash;
        lastUpdatedBlock = block.number;
    }

    function setBitcoinBlockDataCompact() public {
        _setBitcoinBlockDataCompact();
    }

    /// @notice Internal implementation of setBitcoinBlockDataCompact
    function _setBitcoinBlockDataCompact() internal {
        address depositor = SYSTEM_ACCOUNT();
        assembly {
            // Revert if the caller is not the depositor account.
            if xor(caller(), depositor) {
                mstore(0x00, 0x3cc50b45) // 0x3cc50b45 is the 4-byte selector of "NotDepositor()"
                revert(0x1C, 0x04) // returns the stored 4-byte selector from above
            }

            // Store values directly from calldata
            sstore(currentBlockHeight.slot, and(calldataload(4), 0xffffffffffffffff)) // uint64
            sstore(blockHashSixBlocksBack.slot, calldataload(36)) // bytes32
            sstore(lastUpdatedBlock.slot, number()) // block.number
        }
    }
}
