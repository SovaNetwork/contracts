// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@solady/tokens/WETH.sol";
import "@solady/auth/Ownable.sol";

import "./lib/CorsaBitcoin.sol";

contract uBTC is WETH, Ownable {
    error DecodeFailure();
    error InvalidOutput(string expected, string actual);
    error InsufficientDeposit();
    error InsufficientInput();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();

    event BitcoinTx_(bytes32 txid, uint256 locktime);
    event Outputs_(string addr, uint256 value, bytes script);
    event Inputs_(bytes32 prevTxHash, uint32 outputIndex, bytes scriptSig, bytes[] witness);
    event ReturnData(bool success, bytes returndata);
    event RequiredOutput(string addr);

    constructor() WETH() Ownable() {
        _initializeOwner(msg.sender);
    }

    function name() public view virtual override returns (string memory) {
        return "Universal Bitcoin";
    }

    function symbol() public view virtual override returns (string memory) {
        return "uBTC";
    }

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    function deposit() public payable override {
        revert("uBTC: must deposit with native BTC");
    }

    function withdraw(uint256) public pure override {
        revert("uBTC: must use withdraw with destination");
    }

    function depositBTC(uint256 amount, bytes calldata signedTx) public {
        // Decode signed bitcoin tx
        CorsaBitcoin.BitcoinTx memory btcTx = CorsaBitcoin.decodeBitcoinTx(signedTx);

        // input validations
        if (btcTx.outputs.length < 1 || btcTx.outputs[0].value < amount) {
            revert InsufficientDeposit();
        }

        if (btcTx.inputs.length < 1) {
            revert InsufficientInput();
        }

        if (btcTx.locktime > block.timestamp) {
            revert InvalidLocktime();
        }

        // Recover this contract's bitcoin address from its ethereum address
        bytes memory contractBtcAddress = CorsaBitcoin.convertEthToBtcAddress(address(this));

        // Check that this contract's bitcoin address is the same as the signed tx's output[0] address
        if (keccak256(contractBtcAddress) != keccak256(bytes(btcTx.outputs[0].addr))) {
            revert InvalidOutput(btcTx.outputs[0].addr, string(contractBtcAddress));
        }

        // Check if signature is valid and the inputs are unspent
        if (!CorsaBitcoin.checkSignature(signedTx)) {
            revert UnsignedInput();
        }

        // mint uBTC
        _mint(msg.sender, amount);

        // Broadcast signed btc tx
        if (!CorsaBitcoin.broadcastBitcoinTx(signedTx)) {
            revert BroadcastFailure();
        }
    }

    function withdraw(uint256 amount, string calldata dest) public {
        // burn uBTC
        _burn(msg.sender, amount);

        // sign BTC tx for sending amount to specified destination, then broadcast tx
        if(!CorsaBitcoin.sendBitcoin(address(this), amount, dest)) {
            revert BroadcastFailure();
        }
    }

    function adminBurn(address wallet, uint256 amount) public onlyOwner {
        _burn(wallet, amount);
    }

    // ============================= HELPER FUNCTIONS ============================

    function strcompare(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(bytes(a)) == keccak256(bytes(b)));
    }
}