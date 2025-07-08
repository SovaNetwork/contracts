// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { SendParam, MessagingFee, MessagingReceipt, OFTReceipt } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import "./interfaces/ISovaBTC.sol";

/**
 * @title SovaBTCOFT
 * @notice LayerZero Omnichain Fungible Token (OFT) implementation for SovaBTC
 * @dev LayerZero V2 integration with cross-chain burn/mint mechanism
 * @dev Compatible with existing wrapper contracts via ISovaBTC interface
 */
contract SovaBTCOFT is OFT, ISovaBTC {
    
    // ============ State Variables ============
    
    /// @notice Mapping of addresses authorized to mint tokens (wrapper contracts)
    mapping(address => bool) public minters;
    
    /// @notice Contract pause state
    bool private _paused;
    
    /// @notice Minimum deposit amount in satoshis (for ISovaBTC compatibility)
    uint256 public minDepositAmount;
    
    /// @notice Maximum deposit amount in satoshis (for ISovaBTC compatibility)  
    uint256 public maxDepositAmount;
    
    /// @notice Maximum gas limit amount in satoshis (for ISovaBTC compatibility)
    uint256 public maxGasLimitAmount;
    
    // ============ Events ============
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event AdminMinted(address indexed to, uint256 amount);
    event AdminBurned(address indexed from, uint256 amount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);
    
    // ============ Errors ============
    
    error UnauthorizedMinter(address caller);
    error ContractPaused();
    error ZeroAmount();
    error ZeroAddress();
    
    // ============ Modifiers ============
    
    modifier onlyMinter() {
        if (!minters[msg.sender]) revert UnauthorizedMinter(msg.sender);
        _;
    }
    
    modifier whenNotPaused() {
        if (_paused) revert ContractPaused();
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Constructor for SovaBTC LayerZero OFT
     * @param _name Token name
     * @param _symbol Token symbol  
     * @param _lzEndpoint LayerZero endpoint address
     * @param _owner Initial owner and delegate address
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner
    ) OFT(_name, _symbol, _lzEndpoint, _owner) Ownable() {
        // Set deployer as initial minter
        minters[msg.sender] = true;
        emit MinterAdded(msg.sender);
        
        // Initialize default values
        minDepositAmount = 10_000; // 0.0001 BTC
        maxDepositAmount = 100_000_000_000; // 1000 BTC  
        maxGasLimitAmount = 50_000_000; // 0.5 BTC
        _paused = false;
    }
    
    // ============ LayerZero OFT Overrides ============
    
    /**
     * @notice Returns 8 decimals for Bitcoin compatibility
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }
    
    // ============ Minter Management ============
    
    /**
     * @notice Add a new minter (wrapper contracts)
     * @param minter Address to add as minter
     */
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @notice Remove a minter
     * @param minter Address to remove as minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @notice Check if an address is a minter
     * @param account Address to check
     * @return True if the address is a minter
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }
    
    // ============ ISovaBTC Interface Implementation ============
    
    /**
     * @notice Admin mint function (compatible with wrapper contracts)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function adminMint(address to, uint256 amount) external onlyMinter whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        _mint(to, amount);
        emit AdminMinted(to, amount);
    }
    
    /**
     * @notice Admin burn function (compatible with wrapper contracts)
     * @param from Address to burn tokens from  
     * @param amount Amount of tokens to burn
     */
    function adminBurn(address from, uint256 amount) external onlyMinter whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        _burn(from, amount);
        emit AdminBurned(from, amount);
    }
    
    /**
     * @notice Check if contract is paused
     */
    function isPaused() external view returns (bool) {
        return _paused;
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        if (_paused) revert ContractPaused();
        _paused = true;
        emit ContractPausedByOwner(msg.sender);
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        if (!_paused) revert("Contract not paused");
        _paused = false;
        emit ContractUnpausedByOwner(msg.sender);
    }
    
    /**
     * @notice Set minimum deposit amount
     */
    function setMinDepositAmount(uint64 _minAmount) external onlyOwner {
        minDepositAmount = _minAmount;
    }
    
    /**
     * @notice Set maximum deposit amount
     */
    function setMaxDepositAmount(uint64 _maxAmount) external onlyOwner {
        maxDepositAmount = _maxAmount;
    }
    
    /**
     * @notice Set maximum gas limit amount
     */
    function setMaxGasLimitAmount(uint64 _maxGasLimitAmount) external onlyOwner {
        maxGasLimitAmount = _maxGasLimitAmount;
    }
    
    // ============ Bitcoin-Specific Functions (Not Implemented for OFT) ============
    
    /**
     * @notice Bitcoin deposit function - not implemented for OFT
     * @dev This function is only available on the main Sova chain
     */
    function depositBTC(uint64, bytes calldata) external pure {
        revert("SovaBTCOFT: Bitcoin deposits not supported on OFT contract");
    }
    
    /**
     * @notice Bitcoin withdrawal function - not implemented for OFT
     * @dev This function is only available on the main Sova chain
     */
    function withdraw(uint64, uint64, uint64, string calldata) external pure {
        revert("SovaBTCOFT: Bitcoin withdrawals not supported on OFT contract");
    }
    
    /**
     * @notice Check if transaction is used - not implemented for OFT
     */
    function isTransactionUsed(bytes32) external pure returns (bool) {
        return false;
    }
    
    // ============ Access Control Overrides ============
    
    /**
     * @notice Override _debit to add pause check
     */
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal override whenNotPaused returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        return super._debit(_from, _amountLD, _minAmountLD, _dstEid);
    }
    
    /**
     * @notice Override _credit to add pause check  
     */
    function _credit(
        address _to,
        uint256 _amountLD,
        uint32 _srcEid
    ) internal override whenNotPaused returns (uint256 amountReceivedLD) {
        return super._credit(_to, _amountLD, _srcEid);
    }
} 