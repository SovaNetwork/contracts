// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

contract GetBlockCount {
    address private constant BTC_PRECOMPILE = address(0x999);
    bytes1 private constant GETBLOCK_LEADING_BYTES = 0x01;

    error PrecompileFailure();

    event BlockCount(uint64 count);

    function getBlockCount() public returns (uint64) {
        (bool success, bytes memory returndata) = BTC_PRECOMPILE.call(abi.encodePacked(GETBLOCK_LEADING_BYTES));
        if (!success) {
            revert PrecompileFailure();
        }

        require(returndata.length == 8, "Unexpected result length");

        uint64 blockCount = uint64(bytes8(returndata));
        emit BlockCount(blockCount);

        return blockCount;
    }
}
