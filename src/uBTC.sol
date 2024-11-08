// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@solady/tokens/WETH.sol";
import "@solady/auth/Ownable.sol";

import "./lib/CorsaBitcoin.sol";

contract uBTC is WETH, Ownable {
    error InvalidOutput(string expected, string actual);
    error InsufficientDeposit();
    error InsufficientInput();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();
    error AmountTooBig();

    event Deposit(bytes32 txid, uint256 amount);
    event Withdraw(bytes32 txid, uint256 amount);

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
        if (amount >= type(uint64).max) {
            revert AmountTooBig();
        }

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
        bytes32 txid = CorsaBitcoin.broadcastBitcoinTx(signedTx);

        emit Deposit(txid, amount);
    }

    function withdraw(uint64 amount, uint32 btcBlockHeight, string calldata dest) public {
        // burn uBTC
        // TODO(powvt): this hardcoded amount is the btc withdraw gas fee paid by the network
        _burn(msg.sender, uint256(amount) + 1000000);

        // Create Bitcoin transaction using the UTXOs
        bytes memory signedTx = CorsaBitcoin.createAndSignBitcoinTx(address(this), amount, btcBlockHeight, dest);

        // Broadcast signed BTC tx
        bytes32 txid = CorsaBitcoin.broadcastBitcoinTx(signedTx);

        emit Withdraw(txid, amount);
    }

    function adminBurn(address wallet, uint256 amount) public onlyOwner {
        _burn(wallet, amount);
    }
}
