// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../src/interfaces/ISovaBTC.sol";

contract MockSovaBTC is ISovaBTC {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    address public owner;
    mapping(address => bool) public minters;
    mapping(address => bool) public burners;
    
    constructor() {
        owner = msg.sender;
        minters[msg.sender] = true;
        burners[msg.sender] = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized minter");
        _;
    }
    
    modifier onlyBurner() {
        require(burners[msg.sender], "Not authorized burner");
        _;
    }
    
    function name() external pure returns (string memory) {
        return "Mock Sova Bitcoin";
    }
    
    function symbol() external pure returns (string memory) {
        return "mockSovaBTC";
    }
    
    function decimals() external pure returns (uint8) {
        return 8;
    }
    
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner_, address spender) external view returns (uint256) {
        return _allowances[owner_][spender];
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        
        return true;
    }
    
    function adminMint(address wallet, uint256 amount) external onlyMinter {
        _mint(wallet, amount);
    }
    
    function adminBurn(address wallet, uint256 amount) external onlyBurner {
        _burn(wallet, amount);
    }
    
    function setMinter(address account, bool authorized) external onlyOwner {
        minters[account] = authorized;
    }
    
    function setBurner(address account, bool authorized) external onlyOwner {
        burners[account] = authorized;
    }
    
    /**
     * @notice Test helper function to mint tokens and update total supply properly
     * @param account Address to mint tokens to
     * @param amount Amount to mint
     */
    function testMint(address account, uint256 amount) external {
        // Skip if trying to mint to zero address (expected to revert)
        if (account == address(0)) return;
        _mint(account, amount);
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from zero address");
        require(to != address(0), "ERC20: transfer to zero address");
        
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
    }
    
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to zero address");
        
        _totalSupply += amount;
        _balances[account] += amount;
    }
    
    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from zero address");
        
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        
        _balances[account] = accountBalance - amount;
        _totalSupply -= amount;
    }
    
    function _approve(address owner_, address spender, uint256 amount) internal {
        require(owner_ != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");
        
        _allowances[owner_][spender] = amount;
    }
    
    // Additional functions required by ISovaBTC interface
    function depositBTC(uint64 amount, bytes calldata signedTx) external {
        // Mock implementation - not used in tests
    }
    
    function isTransactionUsed(bytes32 txid) external view returns (bool) {
        // Mock implementation - not used in tests
        return false;
    }
    
    function isPaused() external view returns (bool) {
        // Mock implementation - not used in tests
        return false;
    }
    
    function withdraw(uint64 amount, uint64 btcGasLimit, uint64 btcBlockHeight, string calldata dest) external {
        // Mock implementation - not used in tests
    }
    
    function setMinDepositAmount(uint64 _minAmount) external {
        // Mock implementation - not used in tests
    }
    
    function setMaxDepositAmount(uint64 _maxAmount) external {
        // Mock implementation - not used in tests
    }
    
    function setMaxGasLimitAmount(uint64 _maxGasLimitAmount) external {
        // Mock implementation - not used in tests
    }
    
    function pause() external {
        // Mock implementation - not used in tests
    }
    
    function unpause() external {
        // Mock implementation - not used in tests
    }
    
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Not owner");
        owner = newOwner;
    }
} 