// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./lib/CorsaBitcoin.sol";

contract GetBtcAddress {
    string constant EXPECTED_BTC_ADDRESS = "bcrt1qdqvts4mprnngm0jcn5r6q0arelty7kpdt3uvk6";
    bytes32 constant EXPECTED_BTC_ADDRESS_HASH = keccak256(bytes(EXPECTED_BTC_ADDRESS));

    event BtcAddress(string btcAddr, bytes32 hashedReturndata);
    event HashComparison(bytes32 expectedHash, bytes32 actualHash, bool matches);
    event RawData(bytes rawReturnData, bytes rawExpectedData);

    error PrecompileFailure();
    error InvalidBtcAddress();

    function getBtcAddress() public {
        (bool success, bytes memory returndata) = CorsaBitcoin.BTC_PRECOMPILE.call(
            abi.encodePacked(CorsaBitcoin.ADDRESS_CONVERT_LEADING_BYTE, address(this))
        );
        if (!success) {
            revert PrecompileFailure();
        }

        bytes32 hashedAddr = keccak256(returndata);
        bytes32 hashedExpected = keccak256(bytes(EXPECTED_BTC_ADDRESS));

        if (hashedAddr != hashedExpected) {
            revert InvalidBtcAddress();
        }
    }

    function getExpectedBtcAddress() public pure returns (string memory) {
        return EXPECTED_BTC_ADDRESS;
    }

    function getExpectedBtcAddressHash() public pure returns (bytes32) {
        return keccak256(bytes(EXPECTED_BTC_ADDRESS));
    }
}