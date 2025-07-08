// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/oft-evm/contracts/oft/OFT.sol";

/**
 * @title SovaBTCOFTSimple
 * @notice Minimal LayerZero OFT implementation for testing
 */
contract SovaBTCOFTSimple is OFT {
    
    /// @notice Address authorized to mint tokens
    address public minter;
    
    // Events
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    
    // Errors
    error UnauthorizedMinter(address caller);
    error ZeroAddress();
    
    // Modifiers
    modifier onlyMinter() {
        if (msg.sender != minter) revert UnauthorizedMinter(msg.sender);
        _;
    }
    
    /**
     * @dev Constructor
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        address _minter
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {
        if (_minter == address(0)) revert ZeroAddress();
        minter = _minter;
    }
    
    /**
     * @notice Returns 8 decimals for Bitcoin compatibility
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }
    
    /**
     * @notice Override shared decimals to 6 for LayerZero compatibility
     */
    function sharedDecimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @notice Admin mint function
     */
    function adminMint(address _to, uint256 _amount) external onlyMinter {
        _mint(_to, _amount);
    }
    
    /**
     * @notice Admin burn function
     */
    function adminBurn(address _from, uint256 _amount) external onlyMinter {
        _burn(_from, _amount);
    }
    
    /**
     * @notice Update minter address
     */
    function setMinter(address _newMinter) external onlyOwner {
        if (_newMinter == address(0)) revert ZeroAddress();
        address oldMinter = minter;
        minter = _newMinter;
        emit MinterUpdated(oldMinter, _newMinter);
    }
} 