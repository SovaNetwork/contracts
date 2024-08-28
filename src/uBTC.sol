// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.26;

import "solady/src/tokens/WETH.sol";
import "solady/src/auth/Ownable.sol";

contract uBTC is WETH, Ownable {
    address private constant DECODE_PRECOMPILE = address(0x21000);
    address private constant CHECKSIG_PRECOMPILE = address(0x21001);
    address private constant ADDRESS_CONVERT_PRECOMPILE = address(0x21002);
    address private constant BROADCAST_PRECOMPILE = address(0x21003);
    address private constant SEND_BTC_PRECOMPILE = address(0x21004);

    error InvalidOutput();
    error InsufficientDeposit();
    error InsufficientInput();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();

    enum ScriptType {
        P2PKH,
        P2SH,
        P2WPKH,
        P2WSH
    }

    struct Output {
        string addr;
        uint256 value;
        bytes script;
    }

    struct Input {
        string addr;
        bytes32 prevTxHash;
        uint32 outputIndex;
        ScriptType outputScriptType;
        bytes scriptSig;
    }

    struct BitcoinTx {
        bytes32 txid;
        Output[] outputs;
        Input[] inputs;
        uint256 locktime;
    }

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
        (bool success, bytes memory returndata) = DECODE_PRECOMPILE.call(abi.encodePacked(signedTx));
        BitcoinTx memory btcTx = abi.decode(returndata, (BitcoinTx));

        (success, returndata) = ADDRESS_CONVERT_PRECOMPILE.call(abi.encodePacked(address(this)));
        string memory requiredOutput = abi.decode(returndata, (string));

        if (!strcompare(btcTx.outputs[0].addr, requiredOutput)) {
            revert InvalidOutput();
        }

        if (btcTx.outputs.length < 1 || btcTx.outputs[0].value < amount) {
            revert InsufficientDeposit();
        }

        if (btcTx.inputs.length < 1) {
            revert InsufficientInput();
        }

        (success,) = CHECKSIG_PRECOMPILE.call(abi.encode(btcTx.inputs[0]));

        if (!success) {
            revert UnsignedInput();
        }

        if (btcTx.locktime > block.timestamp) {
            revert InvalidLocktime();
        }

        _mint(msg.sender, amount);

        (success,) = BROADCAST_PRECOMPILE.call(abi.encodePacked(signedTx));

        if (!success) {
            revert BroadcastFailure();
        }
    }

    function withdraw(uint256 amount, string calldata dest) public {
        _burn(msg.sender, amount);

        (bool success,) = SEND_BTC_PRECOMPILE.call(abi.encodePacked(address(this), dest, amount));

        if (!success) {
            revert BroadcastFailure();
        }
    }

    function adminBurn(address wallet, uint256 amount) public onlyOwner {
        _burn(wallet, amount);
    }

    function strcompare(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
