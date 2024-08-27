// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

contract GetBlockCount {
    address private constant BTC_PRECOMPILE = address(0x999);
    bytes4 private constant GETBLOCK_LEADING_BYTES = bytes4("0x01");

    error PrecompileFailure();

    event BlockCount(uint256 count);

    function getBlockCount() public {
        (bool success, bytes memory returndata) = BTC_PRECOMPILE.call(abi.encodePacked(GETBLOCK_LEADING_BYTES));
        if (!success) {
            revert PrecompileFailure();
        }

        uint256 count = abi.decode(returndata, (uint256));

        emit BlockCount(count);
    }
}