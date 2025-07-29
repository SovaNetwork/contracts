// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20PausableUpgradeable} from
    "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title BridgedSovaBTC
 * @dev Canonical bridged version of sovaBTC for non-Sova networks
 * @notice This token represents sovaBTC bridged from Sova Network via Hyperlane
 */
contract BridgedSovaBTC is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    /// @notice Role for bridging operations (Hyperlane relayer)
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    /// @notice Role for vault operations (yield distribution)
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    /// @notice Role for upgrades
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @notice The original sovaBTC contract address on Sova Network
    address public constant SOVA_NETWORK_SOVABTC = 0x2100000000000000000000000000000000000020;

    /// @notice Hyperlane mailbox contract for cross-chain messaging
    address public hyperlaneMailbox;

    /// @notice Sova Network domain ID for Hyperlane
    uint32 public constant SOVA_DOMAIN = 0; // Will be set to actual Sova domain

    // Events
    event BridgeTransfer(address indexed from, address indexed to, uint256 amount, uint32 destinationDomain);
    event BridgeReceive(address indexed to, uint256 amount, uint32 originDomain);
    event HyperlaneMailboxUpdated(address indexed oldMailbox, address indexed newMailbox);

    // Errors
    error UnauthorizedBridge();
    error InvalidMailbox();
    error ZeroAddress();
    error ZeroAmount();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin, address _hyperlaneMailbox, address bridgeRelayer) public initializer {
        __ERC20_init("Bridged Sova Bitcoin", "sovaBTC");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        if (admin == address(0) || _hyperlaneMailbox == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        if (bridgeRelayer != address(0)) {
            _grantRole(BRIDGE_ROLE, bridgeRelayer);
        }

        hyperlaneMailbox = _hyperlaneMailbox;
    }

    /**
     * @notice Returns 8 decimals to match Bitcoin precision
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    /**
     * @notice Mint tokens - only callable by authorized bridges or vaults
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        if (!hasRole(BRIDGE_ROLE, msg.sender) && !hasRole(VAULT_ROLE, msg.sender)) {
            revert UnauthorizedBridge();
        }
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address - only callable by bridges or vaults
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) public override {
        if (hasRole(BRIDGE_ROLE, msg.sender) || hasRole(VAULT_ROLE, msg.sender)) {
            _burn(from, amount);
        } else {
            super.burnFrom(from, amount);
        }
    }

    /**
     * @notice Bridge tokens to Sova Network
     * @param recipient Recipient address on Sova Network
     * @param amount Amount to bridge
     */
    function bridgeToSova(address recipient, uint256 amount) external {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        // Burn tokens on this chain
        _burn(msg.sender, amount);

        // Send cross-chain message via Hyperlane
        bytes memory message = abi.encode(recipient, amount);
        IHyperlaneMailbox(hyperlaneMailbox).dispatch(SOVA_DOMAIN, addressToBytes32(SOVA_NETWORK_SOVABTC), message);

        emit BridgeTransfer(msg.sender, recipient, amount, SOVA_DOMAIN);
    }

    /**
     * @notice Handle incoming bridge message from Hyperlane
     * @param origin Domain of origin chain
     * @param sender Original sender address (encoded as bytes32)
     * @param body Message body containing recipient and amount
     */
    function handle(uint32 origin, bytes32 sender, bytes calldata body) external {
        if (msg.sender != hyperlaneMailbox) revert InvalidMailbox();

        // Decode the message
        (address recipient, uint256 amount) = abi.decode(body, (address, uint256));

        // Mint tokens to recipient
        _mint(recipient, amount);

        emit BridgeReceive(recipient, amount, origin);
    }

    /**
     * @notice Update Hyperlane mailbox address
     * @param newMailbox New mailbox address
     */
    function setHyperlaneMailbox(address newMailbox) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newMailbox == address(0)) revert ZeroAddress();

        address oldMailbox = hyperlaneMailbox;
        hyperlaneMailbox = newMailbox;

        emit HyperlaneMailboxUpdated(oldMailbox, newMailbox);
    }

    /**
     * @notice Grant vault role to a vault contract
     * @param vault Vault contract address
     */
    function grantVaultRole(address vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (vault == address(0)) revert ZeroAddress();
        _grantRole(VAULT_ROLE, vault);
    }

    /**
     * @notice Grant bridge role to a bridge relayer
     * @param bridge Bridge relayer address
     */
    function grantBridgeRole(address bridge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (bridge == address(0)) revert ZeroAddress();
        _grantRole(BRIDGE_ROLE, bridge);
    }

    /**
     * @notice Pause the contract - emergency use only
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Convert address to bytes32 for Hyperlane
     */
    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    /**
     * @notice Authorize contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @notice Override required by Solidity
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }
}

/**
 * @dev Minimal Hyperlane Mailbox interface
 */
interface IHyperlaneMailbox {
    function dispatch(uint32 destinationDomain, bytes32 recipientAddress, bytes calldata messageBody)
        external
        returns (bytes32 messageId);
}
