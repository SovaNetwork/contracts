// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@solady/auth/Ownable.sol";

/**
 * @title SOVAToken
 * @notice SOVA token for the SovaBTC ecosystem
 * @dev ERC20 token with minting capabilities for rewards distribution
 */
contract SOVAToken is ERC20, ERC20Burnable, Ownable {
    
    /// @notice Maximum total supply (100 million SOVA)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    
    /// @notice Minter role mapping
    mapping(address => bool) public minters;
    
    /* ----------------------- EVENTS ----------------------- */
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    /* ----------------------- CUSTOM ERRORS ----------------------- */
    
    error ExceedsMaxSupply();
    error UnauthorizedMinter();
    error ZeroAddress();
    
    /* ----------------------- MODIFIERS ----------------------- */
    
    modifier onlyMinter() {
        if (!minters[msg.sender]) revert UnauthorizedMinter();
        _;
    }
    
    /* ----------------------- CONSTRUCTOR ----------------------- */
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _initializeOwner(initialOwner);
        
        if (initialSupply > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
        
        // Grant initial owner minting rights
        minters[initialOwner] = true;
        emit MinterAdded(initialOwner);
    }
    
    /* ----------------------- MINTING FUNCTIONS ----------------------- */
    
    /**
     * @notice Mint tokens to an address
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();
        _mint(to, amount);
    }
    
    /**
     * @notice Mint tokens to multiple addresses (batch minting)
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyMinter {
        if (recipients.length != amounts.length) revert("Array length mismatch");
        
        uint256 totalMintAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalMintAmount += amounts[i];
        }
        
        if (totalSupply() + totalMintAmount > MAX_SUPPLY) revert ExceedsMaxSupply();
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] != address(0) && amounts[i] > 0) {
                _mint(recipients[i], amounts[i]);
            }
        }
    }
    
    /* ----------------------- MINTER MANAGEMENT ----------------------- */
    
    /**
     * @notice Add a new minter
     * @param minter Address to grant minting rights
     */
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        
        if (!minters[minter]) {
            minters[minter] = true;
            emit MinterAdded(minter);
        }
    }
    
    /**
     * @notice Remove a minter
     * @param minter Address to revoke minting rights from
     */
    function removeMinter(address minter) external onlyOwner {
        if (minters[minter]) {
            minters[minter] = false;
            emit MinterRemoved(minter);
        }
    }
    
    /**
     * @notice Check if an address is a minter
     * @param account Address to check
     * @return True if the address is a minter
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
    
    /* ----------------------- VIEW FUNCTIONS ----------------------- */
    
    /**
     * @notice Get remaining supply that can be minted
     * @return Remaining mintable supply
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @notice Check if minting would exceed max supply
     * @param amount Amount to check
     * @return True if minting is possible
     */
    function canMint(uint256 amount) external view returns (bool) {
        return totalSupply() + amount <= MAX_SUPPLY;
    }
} 