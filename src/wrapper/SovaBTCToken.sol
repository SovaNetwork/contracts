// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import {ERC20PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import {ERC20PermitUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SovaBTCToken
 * @dev ERC-20 token representing wrapped Bitcoin variants
 * @notice This token maintains 1:1 backing with deposited Bitcoin tokens
 */
contract SovaBTCToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    ERC20PausableUpgradeable, 
    OwnableUpgradeable, 
    ERC20PermitUpgradeable, 
    UUPSUpgradeable 
{
    /// @notice The wrapper contract that can mint/burn tokens
    address public wrapper;
    
    /// @notice Emitted when the wrapper address is updated
    event WrapperUpdated(address indexed oldWrapper, address indexed newWrapper);
    
    error OnlyWrapper();
    error ZeroAddress();

    modifier onlyWrapper() {
        if (msg.sender != wrapper) revert OnlyWrapper();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __ERC20_init("Sova Wrapped Bitcoin", "sovaBTC");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __Ownable_init(initialOwner);
        __ERC20Permit_init("Sova Wrapped Bitcoin");
        __UUPSUpgradeable_init();
    }

    /**
     * @notice Returns 8 decimals to match Bitcoin precision
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    /**
     * @notice Set the wrapper contract address
     * @param _wrapper Address of the wrapper contract
     */
    function setWrapper(address _wrapper) external onlyOwner {
        if (_wrapper == address(0)) revert ZeroAddress();
        
        address oldWrapper = wrapper;
        wrapper = _wrapper;
        
        emit WrapperUpdated(oldWrapper, _wrapper);
    }

    /**
     * @notice Mint tokens - only callable by wrapper contract
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyWrapper {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address - only callable by wrapper contract
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) public override {
        if (msg.sender == wrapper) {
            _burn(from, amount);
        } else {
            super.burnFrom(from, amount);
        }
    }

    /**
     * @notice Pause the contract - emergency use only
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Authorize contract upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }
}