// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@solady/tokens/WETH.sol";
import "@solady/auth/Ownable.sol";

import "./lib/SovaBitcoin.sol";

contract uBTC is WETH, Ownable {
    // Fixed withdrawal fee in satoshis
    uint256 public constant WITHDRAWAL_FEE = 1000000;

    error InvalidOutput(string expected, string actual);
    error InsufficientDeposit();
    error InsufficientInput();
    error InsufficientAmount();
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
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.decodeBitcoinTx(signedTx);

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
        bytes memory contractBtcAddress = SovaBitcoin.convertEthToBtcAddress(address(this));

        // Check that this contract's bitcoin address is the same as the signed tx's output[0] address
        if (keccak256(contractBtcAddress) != keccak256(bytes(btcTx.outputs[0].addr))) {
            revert InvalidOutput(btcTx.outputs[0].addr, string(contractBtcAddress));
        }

        // Check if signature is valid and the inputs are unspent
        if (!SovaBitcoin.checkSignature(signedTx)) {
            revert UnsignedInput();
        }

        // mint uBTC
        _mint(msg.sender, amount);

        // Broadcast signed btc tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Deposit(btcTx.txid, amount);
    }

    function withdraw(uint64 amount, uint32 btcBlockHeight, string calldata dest) public {
        // Check if user has enough balance for both amount and fee
        uint256 totalRequired = uint256(amount) + WITHDRAWAL_FEE;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        // Burn both the withdrawal amount and the fee
        _burn(msg.sender, totalRequired);

        // Create Bitcoin transaction using the UTXOs
        bytes memory signedTx = SovaBitcoin.createAndSignBitcoinTx(address(this), amount, btcBlockHeight, dest);

        // Decode signed bitcoin tx
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.decodeBitcoinTx(signedTx);

        // Broadcast signed BTC tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Withdraw(btcTx.txid, amount);
    }

    function adminBurn(address wallet, uint256 amount) public onlyOwner {
        _burn(wallet, amount);
    }
}
