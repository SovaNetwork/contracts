// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFTCore } from "@layerzerolabs/oft-evm/contracts/oft/OFTCore.sol";

/**
 * @title SovaBTCOFTFixed
 * @notice LayerZero OFT implementation with explicit Ownable initialization
 */
contract SovaBTCOFTFixed is OFTCore, ERC20, Ownable {
    
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
     * @dev Constructor with explicit Ownable initialization
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        address _minter
    ) 
        ERC20(_name, _symbol) 
        OFTCore(8, _lzEndpoint, _delegate)  // 8 decimals for Bitcoin
        Ownable(_delegate)                   // Explicit Ownable initialization
    {
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
     * @notice Retrieves the address of the underlying ERC20 implementation
     */
    function token() public view returns (address) {
        return address(this);
    }
    
    /**
     * @notice Indicates approval is not required for OFT
     */
    function approvalRequired() external pure returns (bool) {
        return false;
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
    
    /**
     * @dev Burns tokens from the sender's specified balance (OFT implementation)
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal override returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        (amountSentLD, amountReceivedLD) = _debitView(_amountLD, _minAmountLD, _dstEid);
        _burn(_from, amountSentLD);
    }
    
    /**
     * @dev Credits tokens to the specified address (OFT implementation)
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 /*_srcEid*/
    ) internal override returns (uint256 amountReceivedLD) {
        if (_to == address(0x0)) _to = address(0xdead);
        _mint(_to, _amountLD);
        return _amountLD;
    }
} 