// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

library CorsaBitcoin {
    address private constant BTC_PRECOMPILE = address(0x999);

    bytes4 private constant BROADCAST_LEADING_BYTES = 0x00000001;
    bytes4 private constant DECODE_LEADING_BYTES = 0x00000002;
    bytes4 private constant CHECKSIG_LEADING_BYTES = 0x00000003;
    bytes4 private constant ADDRESS_CONVERT_LEADING_BYTES = 0x00000004;
    bytes4 private constant CREATE_AND_SIGN_LEADING_BYTES = 0x00000005;

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

    function decodeBitcoinTx(bytes memory signedTx) internal view returns (BitcoinTx memory) {
        (bool success, bytes memory returndata) =
            BTC_PRECOMPILE.staticcall(abi.encodePacked(DECODE_LEADING_BYTES, signedTx));
        if (!success) revert PrecompileCallFailed();
        return abi.decode(returndata, (BitcoinTx));
    }

    function checkSignature(bytes calldata signedTx) internal view returns (bool) {
        (bool success,) = BTC_PRECOMPILE.staticcall(abi.encodePacked(CHECKSIG_LEADING_BYTES, signedTx));
        return success;
    }

    function convertEthToBtcAddress(address ethAddress) internal returns (bytes memory) {
        (bool success, bytes memory returndata) =
            BTC_PRECOMPILE.call(abi.encodePacked(ADDRESS_CONVERT_LEADING_BYTES, ethAddress));
        if (!success) revert PrecompileCallFailed();
        return returndata;
    }

    function broadcastBitcoinTx(bytes memory signedTx) internal returns (bytes32) {
        (bool success, bytes memory returndata) = BTC_PRECOMPILE.call(abi.encodePacked(BROADCAST_LEADING_BYTES, signedTx));
        if (!success) revert PrecompileCallFailed();
        
        require(returndata.length == 32, "Invalid txid length");
    
        bytes32 txid;
        assembly {
            txid := mload(add(returndata, 32))
        }
        
        return txid;
    }

    function createAndSignBitcoinTx(
        address signer,
        uint64 amount,
        uint64 blockHeight,
        string memory destinationAddress
    ) internal returns (bytes memory) {
        bytes memory inputData = abi.encode(
            CREATE_AND_SIGN_LEADING_BYTES,
            signer,
            amount,
            blockHeight,
            destinationAddress
        );

        (bool success, bytes memory returndata) = BTC_PRECOMPILE.call(inputData);
        if (!success) revert PrecompileCallFailed();

        return returndata;
    }
}
