// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

library CorsaBitcoin {
    address private constant BTC_PRECOMPILE = address(0x999);

    bytes4 private constant BROADCAST_LEADING_BYTE = 0x00000000;
    bytes4 private constant GET_BLOCK_HEIGHT_LEADING_BYTE = 0x00000001;
    bytes4 private constant DECODE_LEADING_BYTE = 0x00000002;
    bytes4 private constant CHECKSIG_LEADING_BYTE = 0x00000003;
    bytes4 private constant ADDRESS_CONVERT_LEADING_BYTE = 0x00000004;
    bytes4 private constant SEND_BTC_LEADING_BYTE = 0x00000005;

    struct Output {
        string addr;
        uint256 value;
        bytes script;
    }

    struct Input {
        bytes32 prevTxHash;
        uint32 outputIndex;
        bytes scriptSig;
        bytes[] witness;
    }

    struct BitcoinTx {
        bytes32 txid;
        Output[] outputs;
        Input[] inputs;
        uint256 locktime;
    }

    error PrecompileCallFailed();

    function decodeBitcoinTx(bytes calldata signedTx) internal view returns (BitcoinTx memory) {
        (bool success, bytes memory returndata) =
            BTC_PRECOMPILE.staticcall(abi.encodePacked(DECODE_LEADING_BYTE, signedTx));
        if (!success) revert PrecompileCallFailed();
        return abi.decode(returndata, (BitcoinTx));
    }

    function checkSignature(bytes calldata signedTx) internal view returns (bool) {
        (bool success,) = BTC_PRECOMPILE.staticcall(abi.encodePacked(CHECKSIG_LEADING_BYTE, signedTx));
        return success;
    }

    function convertEthToBtcAddress(address ethAddress) internal returns (bytes memory) {
        (bool success, bytes memory returndata) =
            BTC_PRECOMPILE.call(abi.encodePacked(ADDRESS_CONVERT_LEADING_BYTE, ethAddress));
        if (!success) revert PrecompileCallFailed();
        return returndata;
    }

    function broadcastBitcoinTx(bytes calldata signedTx) internal returns (bool) {
        (bool success,) = BTC_PRECOMPILE.call(abi.encodePacked(BROADCAST_LEADING_BYTE, signedTx));
        return success;
    }

    function sendBitcoin(address from, uint256 amount, string calldata destination) internal returns (bool) {
        (bool success,) = BTC_PRECOMPILE.call(abi.encodePacked(SEND_BTC_LEADING_BYTE, from, amount, destination));
        return success;
    }

    function getCurrentBlockHeight() internal view returns (uint256) {
        (bool success, bytes memory returndata) =
            BTC_PRECOMPILE.staticcall(abi.encodePacked(GET_BLOCK_HEIGHT_LEADING_BYTE));
        if (!success) revert PrecompileCallFailed();
        return abi.decode(returndata, (uint256));
    }
}
