// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./lib/CorsaBitcoin.sol";

contract GetBlockCount {
    event BlockCount(uint256 blockHeight);

    function getBlockCount() public {
        uint256 blockHeight = CorsaBitcoin.getCurrentBlockHeight();

        emit BlockCount(blockHeight);
    }
}
