// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@solady/tokens/WETH.sol";
import "@solady/auth/Ownable.sol";

import "./lib/CorsaBitcoin.sol";
import "./lib/UTXOManager.sol";

contract uBTC is UTXOManager, WETH, Ownable {
    error InvalidOutput(string expected, string actual);
    error InsufficientDeposit();
    error InsufficientInput();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();
    error AmountTooBig();

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
        if(amount >= type(uint64).max) {
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

        // store the spendable btc tx
        // NOTE: assumes the contract's address is always the first output
        this.addUTXO(txid, 0, uint64(amount));
    }

    function withdraw(uint64 amount, string calldata dest) public {
        // burn uBTC
        // TODO(powvt): how to account for gas fees? burn and have user pay?
        _burn(msg.sender, uint256(amount));

        // Get spendable UTXOs
        UTXOManager.UTXO[] memory utxos = this.getSpendableUTXOs(amount, 1000000); // hardcoded gas fee
        require(utxos.length > 0, "Insufficient UTXOs");

        // Create Bitcoin transaction using the UTXOs
        bytes memory signedTx = CorsaBitcoin.createAndSignBitcoinTx(address(this), utxos, amount, dest);

        // Broadcast signed BTC tx
        CorsaBitcoin.broadcastBitcoinTx(signedTx);

        // Update UTXO set
        for (uint i = 0; i < utxos.length; i++) {
            this.spendUTXO(utxos[i].txid, utxos[i].vout);
        }

        // decode the signed tx to see if there was a change output
        CorsaBitcoin.BitcoinTx memory btcTx = CorsaBitcoin.decodeBitcoinTx(signedTx);

        if (btcTx.outputs.length == 2) {
            // get the change output and add it to the UTXO manager
            // NOTE: assumes the change tx is always the second output
            uint256 changeAmount = btcTx.outputs[1].value;
            if (changeAmount >= type(uint64).max) {
                revert AmountTooBig();
            }
            this.addUTXO(btcTx.txid, 1, uint64(changeAmount));
        }
    }

    function adminBurn(address wallet, uint256 amount) public onlyOwner {
        _burn(wallet, amount);
    }
}
