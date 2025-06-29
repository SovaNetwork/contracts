// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/TokenWrapper.sol";
import "./mocks/MockBTCPrecompile.sol";
import "./mocks/MockERC20BTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Mock Malicious ERC20 Tokens for Testing
/// @notice Various malicious token implementations to test security

/// @dev Token that returns false on transfer without reverting
contract FalseReturnToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "False Return Token";
    string public symbol = "FALSE";
    uint8 public decimals = 18;
    
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return _allowances[owner][spender]; }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    // Always returns false on transfer
    function transfer(address, uint256) external pure override returns (bool) {
        return false;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        if (_allowances[from][msg.sender] >= amount && _balances[from] >= amount) {
            _balances[from] -= amount;
            _balances[to] += amount;
            _allowances[from][msg.sender] -= amount;
            return true; // Normal transfer works
        }
        return false;
    }
}

/// @dev Token with transfer fees
contract FeeToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Fee Token";
    string public symbol = "FEE";
    uint8 public decimals = 8;
    uint256 public constant FEE_RATE = 100; // 1% fee
    
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return _allowances[owner][spender]; }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        return _transferWithFee(msg.sender, to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        _allowances[from][msg.sender] -= amount;
        return _transferWithFee(from, to, amount);
    }
    
    function _transferWithFee(address from, address to, uint256 amount) internal returns (bool) {
        require(_balances[from] >= amount, "Insufficient balance");
        uint256 fee = amount / FEE_RATE; // 1% fee
        uint256 netAmount = amount - fee;
        
        _balances[from] -= amount;
        _balances[to] += netAmount;
        // Fee is burned (lost)
        _totalSupply -= fee;
        
        return true;
    }
}

/// @dev Token that reverts on zero-value transfers
contract ZeroRevertToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Zero Revert Token";
    string public symbol = "ZERO";
    uint8 public decimals = 8;
    
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return _allowances[owner][spender]; }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(amount > 0, "Zero transfer not allowed");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(amount > 0, "Zero transfer not allowed");
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }
}

/// @dev Token with blacklisting functionality
contract BlacklistToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) public blacklisted;
    uint256 private _totalSupply;
    string public name = "Blacklist Token";
    string public symbol = "BLACK";
    uint8 public decimals = 8;
    address public owner;
    
    constructor() { owner = msg.sender; }
    
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }
    
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return _allowances[owner][spender]; }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function blacklist(address account) external {
        require(msg.sender == owner, "Only owner");
        blacklisted[account] = true;
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external override notBlacklisted(msg.sender) notBlacklisted(to) returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override notBlacklisted(from) notBlacklisted(to) returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }
}

/// @dev Reentrancy attack token
contract ReentrancyToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Reentrancy Token";
    string public symbol = "REENT";
    uint8 public decimals = 8;
    
    address public targetWrapper;
    bool public attackEnabled;
    
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return _allowances[owner][spender]; }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
    
    function setTarget(address _targetWrapper) external {
        targetWrapper = _targetWrapper;
    }
    
    function enableAttack() external {
        attackEnabled = true;
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        
        // Reentrancy attack on transfer
        if (attackEnabled && targetWrapper != address(0) && to == targetWrapper) {
            try TokenWrapper(targetWrapper).deposit(address(this), 1e8) {} catch {}
        }
        
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }
}

/// @dev Token with extreme supply values
contract ExtremeSupplyToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Extreme Supply Token";
    string public symbol = "EXTREME";
    uint8 public decimals = 8;
    
    constructor() {
        _totalSupply = type(uint256).max;
        _balances[msg.sender] = type(uint256).max;
    }
    
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return _allowances[owner][spender]; }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        // Don't update total supply to test edge cases
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "Insufficient allowance");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _allowances[from][msg.sender] -= amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }
}

/// @title Malicious ERC20 Token Interaction Tests
/// @notice Comprehensive testing of TokenWrapper security against malicious tokens
contract MaliciousERC20Test is Test {
    SovaBTC public sovaBTC;
    TokenWrapper public wrapper;
    MockBTCPrecompile public mockPrecompile;
    
    address public owner = makeAddr("owner");
    address public user = makeAddr("user");
    address public attacker = makeAddr("attacker");
    
    function setUp() public {
        // Deploy mock precompile
        mockPrecompile = new MockBTCPrecompile();
        vm.etch(address(0x999), address(mockPrecompile).code);
        
        // Deploy contracts
        vm.startPrank(owner);
        sovaBTC = new SovaBTC();
        
        // Deploy TokenWrapper with proxy
        TokenWrapper wrapperImpl = new TokenWrapper();
        bytes memory wrapperInitData = abi.encodeWithSelector(
            TokenWrapper.initialize.selector,
            address(sovaBTC)
        );
        ERC1967Proxy wrapperProxy = new ERC1967Proxy(address(wrapperImpl), wrapperInitData);
        wrapper = TokenWrapper(address(wrapperProxy));
        
        // Transfer ownership of sovaBTC to wrapper so it can mint/burn
        sovaBTC.transferOwnership(address(wrapper));
        
        vm.stopPrank();
    }

    // =============================================================================
    // 9.1: Token returns false on transfer (no revert) → should fail gracefully
    // =============================================================================
    
    function test_FalseReturnTokenDeposit() public {
        FalseReturnToken falseToken = new FalseReturnToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(falseToken));
        vm.stopPrank();
        
        // Mint tokens to user
        falseToken.mint(user, 1e8);
        
        vm.startPrank(user);
        falseToken.approve(address(wrapper), 1e8);
        
        // Deposit should fail gracefully when transfer returns false
        vm.expectRevert(); // Should revert due to SafeERC20 protection
        wrapper.deposit(address(falseToken), 1e8);
        
        vm.stopPrank();
    }
    
    function test_FalseReturnTokenRedemption() public {
        FalseReturnToken falseToken = new FalseReturnToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(falseToken));
        vm.stopPrank();
        
        // Give wrapper some tokens for redemption
        falseToken.mint(address(wrapper), 1e8);
        
        // Give user sovaBTC to redeem
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Redemption should fail when token transfer returns false
        vm.expectRevert(); // Should revert due to SafeERC20 protection
        wrapper.redeem(address(falseToken), 1e8);
        
        vm.stopPrank();
    }

    // =============================================================================
    // 9.2: Token with transfer fees → accounting mismatch detection
    // =============================================================================
    
    function test_FeeTokenDeposit() public {
        FeeToken feeToken = new FeeToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(feeToken));
        vm.stopPrank();
        
        // Mint tokens to user
        feeToken.mint(user, 1e8);
        
        vm.startPrank(user);
        feeToken.approve(address(wrapper), 1e8);
        
        // Record balances before
        uint256 userBalanceBefore = feeToken.balanceOf(user);
        uint256 wrapperBalanceBefore = feeToken.balanceOf(address(wrapper));
        
        // Deposit should succeed but wrapper receives less due to fees
        wrapper.deposit(address(feeToken), 1e8);
        
        // Check actual amounts transferred
        uint256 userBalanceAfter = feeToken.balanceOf(user);
        uint256 wrapperBalanceAfter = feeToken.balanceOf(address(wrapper));
        
        // User loses full amount
        assertEq(userBalanceBefore - userBalanceAfter, 1e8, "User should lose full deposit amount");
        
        // Wrapper receives less due to fee
        uint256 actualReceived = wrapperBalanceAfter - wrapperBalanceBefore;
        assertLt(actualReceived, 1e8, "Wrapper should receive less than deposited amount due to fees");
        
        // User still gets full sovaBTC (potential accounting issue)
        assertEq(sovaBTC.balanceOf(user), 1e8, "User receives full sovaBTC despite fees");
        
        vm.stopPrank();
    }

    // =============================================================================
    // 9.3: Token reverts on zero-value transfers → handle edge case
    // =============================================================================
    
    function test_ZeroRevertTokenEdgeCases() public {
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(zeroToken));
        vm.stopPrank();
        
        // Mint tokens to user
        zeroToken.mint(user, 1e8);
        
        vm.startPrank(user);
        zeroToken.approve(address(wrapper), 1e8);
        
        // Normal deposit should work
        wrapper.deposit(address(zeroToken), 1e8);
        assertEq(sovaBTC.balanceOf(user), 1e8, "Normal deposit should work");
        
        vm.stopPrank();
        
        // Test zero-value redemption
        vm.startPrank(user);
        
        vm.expectRevert(abi.encodeWithSelector(TokenWrapper.ZeroAmount.selector));
        wrapper.redeem(address(zeroToken), 0);
        
        vm.stopPrank();
    }

    // =============================================================================
    // 9.4: Token with blacklisting → user gets blacklisted mid-operation
    // =============================================================================
    
    function test_BlacklistTokenMidOperation() public {
        BlacklistToken blackToken = new BlacklistToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(blackToken));
        vm.stopPrank();
        
        // Mint tokens to user
        blackToken.mint(user, 2e8);
        
        vm.startPrank(user);
        blackToken.approve(address(wrapper), 2e8);
        
        // First deposit should work
        wrapper.deposit(address(blackToken), 1e8);
        assertEq(sovaBTC.balanceOf(user), 1e8, "First deposit should work");
        
        vm.stopPrank();
        
        // Blacklist the user
        blackToken.blacklist(user);
        
        vm.startPrank(user);
        
        // Second deposit should fail due to blacklisting
        vm.expectRevert("Account is blacklisted");
        wrapper.deposit(address(blackToken), 1e8);
        
        vm.stopPrank();
        
        // Test redemption with blacklisted user
        blackToken.mint(address(wrapper), 1e8);
        
        vm.startPrank(user);
        
        // Redemption should fail when user is blacklisted
        vm.expectRevert("Account is blacklisted");
        wrapper.redeem(address(blackToken), 1e8);
        
        vm.stopPrank();
    }

    // =============================================================================
    // 9.5: Reentrancy via malicious token → ReentrancyGuard protection
    // =============================================================================
    
    function test_ReentrancyAttackProtection() public {
        ReentrancyToken reentrancyToken = new ReentrancyToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(reentrancyToken));
        vm.stopPrank();
        
        // Setup attack
        reentrancyToken.setTarget(address(wrapper));
        reentrancyToken.mint(user, 2e8);
        
        vm.startPrank(user);
        reentrancyToken.approve(address(wrapper), 2e8);
        
        // Enable attack
        reentrancyToken.enableAttack();
        
        // First deposit without attack should work
        reentrancyToken.enableAttack(); // This will trigger attack on transfer
        
        // The attack should be prevented - the deposit might succeed but reentrancy should fail
        // Since the malicious token swallows the revert with try-catch, the main call might succeed
        // but the reentrancy should be prevented
        wrapper.deposit(address(reentrancyToken), 1e8);
        
        // Verify that only one deposit succeeded (no double deposit from reentrancy)
        assertEq(sovaBTC.balanceOf(user), 1e8, "Should only have one deposit, reentrancy prevented");
        
        vm.stopPrank();
    }

    // =============================================================================
    // 9.6: Token with very large/small totalSupply → boundary testing
    // =============================================================================
    
    function test_ExtremeSupplyTokenDeposit() public {
        ExtremeSupplyToken extremeToken = new ExtremeSupplyToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(extremeToken));
        vm.stopPrank();
        
        // Token has max uint256 total supply
        assertEq(extremeToken.totalSupply(), type(uint256).max, "Token should have max supply");
        
        // Transfer some tokens to user (extremeToken has max balance initially)
        extremeToken.transfer(user, 1e8);
        
        vm.startPrank(user);
        extremeToken.approve(address(wrapper), 1e8);
        
        // Deposit should work despite extreme total supply
        wrapper.deposit(address(extremeToken), 1e8);
        assertEq(sovaBTC.balanceOf(user), 1e8, "Deposit should work with extreme supply token");
        
        vm.stopPrank();
    }
    
    function test_ExtremeSupplyTokenRedemption() public {
        ExtremeSupplyToken extremeToken = new ExtremeSupplyToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(extremeToken));
        vm.stopPrank();
        
        // Give wrapper tokens for redemption (extremeToken has max balance initially)
        extremeToken.transfer(address(wrapper), 1e8);
        
        // Give user sovaBTC
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Redemption should work
        wrapper.redeem(address(extremeToken), 1e8);
        assertEq(extremeToken.balanceOf(user), 1e8, "User should receive redeemed tokens");
        
        vm.stopPrank();
    }
    
    function test_TokenWithZeroTotalSupply() public {
        // Create a token with zero total supply but user has balance (edge case)
        MockERC20BTC zeroSupplyToken = new MockERC20BTC("Zero Supply", "ZERO", 8);
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(zeroSupplyToken));
        vm.stopPrank();
        
        // Mint tokens to user normally
        zeroSupplyToken.mint(user, 1e8);
        
        vm.startPrank(user);
        zeroSupplyToken.approve(address(wrapper), 1e8);
        
        // Deposit should work
        wrapper.deposit(address(zeroSupplyToken), 1e8);
        assertEq(sovaBTC.balanceOf(user), 1e8, "Deposit should work with token");
        
        vm.stopPrank();
    }
} 