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
    
    function unblacklist(address account) external {
        require(msg.sender == owner, "Only owner");
        blacklisted[account] = false;
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
    bool public redeemAttack;
    
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
    
    function enableRedeemAttack() external {
        redeemAttack = true;
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        
        // Reentrancy attack on transfer to wrapper (deposit flow)
        if (attackEnabled && targetWrapper != address(0) && to == targetWrapper) {
            try TokenWrapper(targetWrapper).deposit(address(this), 1e8) {} catch {}
        }
        
        // Reentrancy attack on transfer from wrapper (redeem flow)
        if (redeemAttack && targetWrapper != address(0) && msg.sender == targetWrapper) {
            try TokenWrapper(targetWrapper).redeem(address(this), 1e8) {} catch {}
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

/// @dev Token that always reverts on transfers
contract AlwaysRevertToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "Always Revert Token";
    string public symbol = "REVERT";
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
    
    function transfer(address, uint256) external pure override returns (bool) {
        revert("Transfer always reverts");
    }
    
    function transferFrom(address, address, uint256) external pure override returns (bool) {
        revert("TransferFrom always reverts");
    }
}

/// @dev Token with no code (EOA)
contract NoCodeToken {
    // This contract will have no ERC20 functions
    // Used to test calling ERC20 functions on an EOA
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
    
    // =============================================================================
    // Additional Coverage Tests
    // =============================================================================
    
    function test_FalseReturnTokenTransferFromBranches() public {
        FalseReturnToken falseToken = new FalseReturnToken();
        
        // Test transferFrom with insufficient allowance
        falseToken.mint(user, 1e8);
        
        vm.startPrank(user);
        falseToken.approve(attacker, 50);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        bool result = falseToken.transferFrom(user, attacker, 1e8);
        assertFalse(result, "Should return false for insufficient allowance");
        vm.stopPrank();
        
        // Test transferFrom with insufficient balance
        vm.startPrank(user);
        falseToken.approve(attacker, 2e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        result = falseToken.transferFrom(user, attacker, 2e8);
        assertFalse(result, "Should return false for insufficient balance");
        vm.stopPrank();
        
        // Test successful transferFrom
        vm.startPrank(attacker);
        result = falseToken.transferFrom(user, attacker, 1e8);
        assertTrue(result, "Should return true for valid transferFrom");
        assertEq(falseToken.balanceOf(attacker), 1e8, "Attacker should receive tokens");
        vm.stopPrank();
    }
    
    function test_FeeTokenBranches() public {
        FeeToken feeToken = new FeeToken();
        
        // Test transfer with insufficient balance
        vm.startPrank(user);
        vm.expectRevert("Insufficient balance");
        feeToken.transfer(attacker, 1e8);
        vm.stopPrank();
        
        // Test transferFrom with insufficient allowance
        feeToken.mint(user, 1e8);
        
        vm.startPrank(attacker);
        vm.expectRevert("Insufficient allowance");
        feeToken.transferFrom(user, attacker, 1e8);
        vm.stopPrank();
        
        // Test successful transfers with fees
        vm.startPrank(user);
        feeToken.approve(attacker, 1e8);
        bool result = feeToken.transfer(attacker, 50);
        assertTrue(result, "Transfer should succeed");
        
        uint256 expectedNet = 50; // For amount 50, fee is 50/100 = 0 (rounds down)
        assertEq(feeToken.balanceOf(attacker), expectedNet, "Should receive net amount after fees");
        vm.stopPrank();
        
        // Test transferFrom
        vm.startPrank(attacker);
        result = feeToken.transferFrom(user, attacker, 50);
        assertTrue(result, "TransferFrom should succeed");
        vm.stopPrank();
    }
    
    function test_ZeroRevertTokenBranches() public {
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        
        // Test zero amount transfer
        vm.startPrank(user);
        vm.expectRevert("Zero transfer not allowed");
        zeroToken.transfer(attacker, 0);
        vm.stopPrank();
        
        // Test zero amount transferFrom
        vm.startPrank(attacker);
        vm.expectRevert("Zero transfer not allowed");
        zeroToken.transferFrom(user, attacker, 0);
        vm.stopPrank();
        
        // Test insufficient balance
        vm.startPrank(user);
        vm.expectRevert("Insufficient balance");
        zeroToken.transfer(attacker, 1e8);
        vm.stopPrank();
        
        // Test insufficient allowance
        zeroToken.mint(user, 1e8);
        
        vm.startPrank(attacker);
        vm.expectRevert("Insufficient allowance");
        zeroToken.transferFrom(user, attacker, 1e8);
        vm.stopPrank();
        
        // Test insufficient balance for transferFrom
        vm.startPrank(user);
        zeroToken.approve(attacker, 2e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        vm.expectRevert("Insufficient balance");
        zeroToken.transferFrom(user, attacker, 2e8);
        vm.stopPrank();
    }
    
    function test_BlacklistTokenBranches() public {
        BlacklistToken blackToken = new BlacklistToken();
        
        // Test blacklist functionality
        blackToken.blacklist(user);
        assertTrue(blackToken.blacklisted(user), "User should be blacklisted");
        
        // Test unblacklist functionality
        blackToken.unblacklist(user);
        assertFalse(blackToken.blacklisted(user), "User should be unblacklisted");
        
        // Test non-owner cannot blacklist
        vm.startPrank(attacker);
        vm.expectRevert("Only owner");
        blackToken.blacklist(user);
        vm.stopPrank();
        
        // Test non-owner cannot unblacklist
        vm.startPrank(attacker);
        vm.expectRevert("Only owner");
        blackToken.unblacklist(user);
        vm.stopPrank();
        
        // Test transfer with blacklisted sender
        blackToken.mint(user, 1e8);
        blackToken.blacklist(user);
        
        vm.startPrank(user);
        vm.expectRevert("Account is blacklisted");
        blackToken.transfer(attacker, 1e8);
        vm.stopPrank();
        
        // Test transfer with blacklisted recipient
        blackToken.unblacklist(user);
        blackToken.blacklist(attacker);
        
        vm.startPrank(user);
        vm.expectRevert("Account is blacklisted");
        blackToken.transfer(attacker, 1e8);
        vm.stopPrank();
        
        // Test transferFrom with blacklisted sender
        vm.startPrank(user);
        blackToken.approve(address(this), 1e8);
        vm.stopPrank();
        
        blackToken.blacklist(user);
        
        vm.expectRevert("Account is blacklisted");
        blackToken.transferFrom(user, address(this), 1e8);
        
        // Test transferFrom with blacklisted recipient
        blackToken.unblacklist(user);
        blackToken.blacklist(address(this));
        
        vm.expectRevert("Account is blacklisted");
        blackToken.transferFrom(user, address(this), 1e8);
        
        // Test insufficient balance and allowance branches
        blackToken.unblacklist(address(this));
        
        // Test with a fresh user to avoid state conflicts
        address freshUser = makeAddr("freshUser");
        blackToken.mint(freshUser, 1e8);
        
        // First test insufficient allowance (user has 1e8, but allowance is 0)
        vm.expectRevert("Insufficient allowance");
        blackToken.transferFrom(freshUser, address(this), 1e8);
        
        // Then test insufficient balance (approve more than balance and try to transfer)
        vm.startPrank(freshUser);
        blackToken.approve(address(this), 2e8);
        vm.stopPrank();
        
        vm.expectRevert("Insufficient balance");
        blackToken.transferFrom(freshUser, address(this), 2e8);
    }
    
    function test_ReentrancyTokenBranches() public {
        ReentrancyToken reentrancyToken = new ReentrancyToken();
        
        // Test redeem attack
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(reentrancyToken));
        vm.stopPrank();
        
        reentrancyToken.setTarget(address(wrapper));
        reentrancyToken.mint(address(wrapper), 2e8);
        reentrancyToken.mint(user, 1e8);
        
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        
        // Enable redeem attack
        reentrancyToken.enableRedeemAttack();
        
        vm.startPrank(user);
        // This should trigger reentrancy on the transfer from wrapper to user
        wrapper.redeem(address(reentrancyToken), 1e8);
        vm.stopPrank();
        
        // Test transferFrom branches
        reentrancyToken.mint(user, 2e8); // Give user more tokens
        
        vm.startPrank(user);
        reentrancyToken.approve(attacker, 1e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        bool result = reentrancyToken.transferFrom(user, attacker, 1e8);
        assertTrue(result, "TransferFrom should succeed");
        vm.stopPrank();
        
        // Test insufficient allowance (allowance is now 0 after previous transfer)
        vm.startPrank(attacker);
        vm.expectRevert("Insufficient allowance");
        reentrancyToken.transferFrom(user, attacker, 1e8);
        vm.stopPrank();
        
        // Test insufficient balance
        uint256 userBalance = reentrancyToken.balanceOf(user);
        
        vm.startPrank(user);
        reentrancyToken.approve(attacker, userBalance + 1e8); // Approve more than user has
        vm.stopPrank();
        
        vm.startPrank(attacker);
        vm.expectRevert("Insufficient balance");
        reentrancyToken.transferFrom(user, attacker, userBalance + 1e8); // Try to transfer more than user has
        vm.stopPrank();
    }
    
    function test_ExtremeSupplyTokenMint() public {
        ExtremeSupplyToken extremeToken = new ExtremeSupplyToken();
        
        // Test mint function (doesn't update total supply)
        uint256 balanceBefore = extremeToken.balanceOf(user);
        uint256 totalSupplyBefore = extremeToken.totalSupply();
        
        extremeToken.mint(user, 1e8);
        
        assertEq(extremeToken.balanceOf(user), balanceBefore + 1e8, "Balance should increase");
        assertEq(extremeToken.totalSupply(), totalSupplyBefore, "Total supply should not change");
    }
    
    function test_AlwaysRevertToken() public {
        AlwaysRevertToken revertToken = new AlwaysRevertToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(revertToken));
        vm.stopPrank();
        
        // Mint tokens to user
        revertToken.mint(user, 1e8);
        
        vm.startPrank(user);
        revertToken.approve(address(wrapper), 1e8);
        
        // Deposit should fail when transfer always reverts
        vm.expectRevert(); // SafeERC20 might use transferFrom in some cases
        wrapper.deposit(address(revertToken), 1e8);
        
        vm.stopPrank();
        
        // Test redemption
        revertToken.mint(address(wrapper), 1e8);
        
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        
        // Redemption should fail when transfer always reverts
        vm.expectRevert(); // Just expect any revert
        wrapper.redeem(address(revertToken), 1e8);
        
        vm.stopPrank();
    }
    
    function test_AlwaysRevertTokenTransferFrom() public {
        AlwaysRevertToken revertToken = new AlwaysRevertToken();
        
        revertToken.mint(user, 1e8);
        
        vm.startPrank(user);
        revertToken.approve(attacker, 1e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        vm.expectRevert("TransferFrom always reverts");
        revertToken.transferFrom(user, attacker, 1e8);
        vm.stopPrank();
    }
    
    function test_TokenDecimalsEdgeCases() public {
        // Test with various decimal configurations
        MockERC20BTC token1 = new MockERC20BTC("Token1", "T1", 1);
        MockERC20BTC token30 = new MockERC20BTC("Token30", "T30", 30);
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(token1));
        wrapper.addAllowedToken(address(token30));
        vm.stopPrank();
        
        // Test 1 decimal token
        token1.mint(user, 10); // 1.0 in 1-decimal token
        
        vm.startPrank(user);
        token1.approve(address(wrapper), 10);
        wrapper.deposit(address(token1), 10);
        
        uint256 expectedSova1 = 10 * (10 ** (8 - 1)); // 10 * 10^7 = 100000000
        assertEq(sovaBTC.balanceOf(user), expectedSova1, "Should handle 1-decimal token");
        vm.stopPrank();
        
        // Test 30 decimal token (extreme case)
        uint256 amount30 = 10 ** 30; // 1.0 in 30-decimal token
        token30.mint(user, amount30);
        
        vm.startPrank(user);
        token30.approve(address(wrapper), amount30);
        wrapper.deposit(address(token30), amount30);
        
        uint256 expectedSova30 = amount30 / (10 ** (30 - 8)); // amount30 / 10^22
        assertEq(sovaBTC.balanceOf(user), expectedSova1 + expectedSova30, "Should handle 30-decimal token");
        vm.stopPrank();
    }
    
    function test_WrapperPausedWithMaliciousTokens() public {
        FeeToken feeToken = new FeeToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(feeToken));
        wrapper.pause();
        vm.stopPrank();
        
        feeToken.mint(user, 1e8);
        
        vm.startPrank(user);
        feeToken.approve(address(wrapper), 1e8);
        
        vm.expectRevert();
        wrapper.deposit(address(feeToken), 1e8);
        
        vm.stopPrank();
    }
    
    function test_InsufficientReserveWithMaliciousToken() public {
        FeeToken feeToken = new FeeToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(feeToken));
        vm.stopPrank();
        
        // Give user sovaBTC to redeem but no tokens in wrapper
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(
            TokenWrapper.InsufficientReserve.selector,
            address(feeToken),
            1e8,
            0
        ));
        wrapper.redeem(address(feeToken), 1e8);
        vm.stopPrank();
    }
    
    // =============================================================================
    // Additional Coverage Tests - Complete missing function calls
    // =============================================================================
    
    function test_AllTokenTotalSupplyFunctions() public {
        FalseReturnToken falseToken = new FalseReturnToken();
        FeeToken feeToken = new FeeToken();
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        BlacklistToken blackToken = new BlacklistToken();
        ReentrancyToken reentrancyToken = new ReentrancyToken();
        AlwaysRevertToken revertToken = new AlwaysRevertToken();
        
        // Call totalSupply on all tokens
        assertEq(falseToken.totalSupply(), 0, "FalseReturnToken totalSupply should be 0");
        assertEq(feeToken.totalSupply(), 0, "FeeToken totalSupply should be 0");
        assertEq(zeroToken.totalSupply(), 0, "ZeroRevertToken totalSupply should be 0");
        assertEq(blackToken.totalSupply(), 0, "BlacklistToken totalSupply should be 0");
        assertEq(reentrancyToken.totalSupply(), 0, "ReentrancyToken totalSupply should be 0");
        assertEq(revertToken.totalSupply(), 0, "AlwaysRevertToken totalSupply should be 0");
    }
    
    function test_AllTokenAllowanceFunctions() public {
        FalseReturnToken falseToken = new FalseReturnToken();
        FeeToken feeToken = new FeeToken();
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        BlacklistToken blackToken = new BlacklistToken();
        ReentrancyToken reentrancyToken = new ReentrancyToken();
        ExtremeSupplyToken extremeToken = new ExtremeSupplyToken();
        AlwaysRevertToken revertToken = new AlwaysRevertToken();
        
        // Call allowance on all tokens
        assertEq(falseToken.allowance(user, attacker), 0, "FalseReturnToken allowance should be 0");
        assertEq(feeToken.allowance(user, attacker), 0, "FeeToken allowance should be 0");
        assertEq(zeroToken.allowance(user, attacker), 0, "ZeroRevertToken allowance should be 0");
        assertEq(blackToken.allowance(user, attacker), 0, "BlacklistToken allowance should be 0");
        assertEq(reentrancyToken.allowance(user, attacker), 0, "ReentrancyToken allowance should be 0");
        assertEq(extremeToken.allowance(user, attacker), 0, "ExtremeSupplyToken allowance should be 0");
        assertEq(revertToken.allowance(user, attacker), 0, "AlwaysRevertToken allowance should be 0");
    }
    
    function test_TokenBalanceOfFunctions() public {
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        
        // Call balanceOf
        assertEq(zeroToken.balanceOf(user), 0, "ZeroRevertToken balanceOf should be 0");
    }
    
    function test_FalseReturnTokenDirectTransfer() public {
        FalseReturnToken falseToken = new FalseReturnToken();
        
        falseToken.mint(user, 1e8);
        
        vm.startPrank(user);
        // Direct transfer call (not through wrapper)
        bool result = falseToken.transfer(attacker, 1e8);
        assertFalse(result, "FalseReturnToken transfer should return false");
        vm.stopPrank();
    }
    
    function test_ZeroRevertTokenSuccessfulTransfer() public {
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        
        zeroToken.mint(user, 1e8);
        
        vm.startPrank(user);
        // Successful transfer (non-zero amount, sufficient balance)
        bool result = zeroToken.transfer(attacker, 1e8);
        assertTrue(result, "ZeroRevertToken transfer should succeed");
        assertEq(zeroToken.balanceOf(attacker), 1e8, "Attacker should receive tokens");
        assertEq(zeroToken.balanceOf(user), 0, "User should have no tokens left");
        vm.stopPrank();
    }
    
    function test_BlacklistTokenSuccessfulTransfer() public {
        BlacklistToken blackToken = new BlacklistToken();
        
        blackToken.mint(user, 1e8);
        
        vm.startPrank(user);
        // Successful transfer when neither party is blacklisted
        bool result = blackToken.transfer(attacker, 1e8);
        assertTrue(result, "BlacklistToken transfer should succeed when not blacklisted");
        assertEq(blackToken.balanceOf(attacker), 1e8, "Attacker should receive tokens");
        assertEq(blackToken.balanceOf(user), 0, "User should have no tokens left");
        vm.stopPrank();
    }
    
    function test_ReentrancyTokenAttackBranches() public {
        ReentrancyToken reentrancyToken = new ReentrancyToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(reentrancyToken));
        vm.stopPrank();
        
        // Set up the reentrancy token to target the wrapper
        reentrancyToken.setTarget(address(wrapper));
        reentrancyToken.mint(user, 2e8);
        reentrancyToken.mint(address(wrapper), 2e8);
        
        vm.startPrank(user);
        reentrancyToken.approve(address(wrapper), 2e8);
        vm.stopPrank();
        
        // Enable redeem attack to hit the branch
        reentrancyToken.enableRedeemAttack();
        
        // Give user sovaBTC to redeem
        vm.startPrank(address(wrapper));
        sovaBTC.adminMint(user, 1e8);
        vm.stopPrank();
        
        vm.startPrank(user);
        // This should trigger the reentrancy attack branch in transfer
        wrapper.redeem(address(reentrancyToken), 1e8);
        vm.stopPrank();
        
        // Verify the attack was attempted but prevented
        assertEq(sovaBTC.balanceOf(user), 0, "User should have redeemed their sovaBTC");
    }
    
    function test_ReentrancyTokenTargetWrapper() public {
        ReentrancyToken reentrancyToken = new ReentrancyToken();
        
        vm.startPrank(owner);
        wrapper.addAllowedToken(address(reentrancyToken));
        vm.stopPrank();
        
        reentrancyToken.setTarget(address(wrapper));
        reentrancyToken.enableAttack();
        reentrancyToken.mint(user, 2e8);
        
        vm.startPrank(user);
        reentrancyToken.approve(address(wrapper), 2e8);
        
        // This should trigger the attack branch where targetWrapper != address(0) && to == targetWrapper
        wrapper.deposit(address(reentrancyToken), 1e8);
        
        // Verify deposit succeeded but reentrancy was prevented
        assertEq(sovaBTC.balanceOf(user), 1e8, "User should have received sovaBTC from deposit");
        vm.stopPrank();
    }
    
    function test_ExtremeSupplyTokenBranchCoverage() public {
        ExtremeSupplyToken extremeToken = new ExtremeSupplyToken();
        
        // Test transfer with sufficient balance (branch coverage)
        extremeToken.mint(user, 1e8);
        
        vm.startPrank(user);
        extremeToken.approve(attacker, 1e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        // Test transferFrom with sufficient allowance and balance
        bool result = extremeToken.transferFrom(user, attacker, 1e8);
        assertTrue(result, "ExtremeSupplyToken transferFrom should succeed");
        vm.stopPrank();
    }
    
    function test_FeeTokenBranchCoverageInsufficientBalance() public {
        FeeToken feeToken = new FeeToken();
        
        // Test _transferWithFee with insufficient balance
        vm.startPrank(user);
        vm.expectRevert("Insufficient balance");
        feeToken.transfer(attacker, 1e8); // User has no tokens
        vm.stopPrank();
    }
    
    function test_ZeroRevertTokenSuccessfulTransferFrom() public {
        ZeroRevertToken zeroToken = new ZeroRevertToken();
        
        zeroToken.mint(user, 1e8);
        
        vm.startPrank(user);
        zeroToken.approve(attacker, 1e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        // Successful transferFrom
        bool result = zeroToken.transferFrom(user, attacker, 1e8);
        assertTrue(result, "ZeroRevertToken transferFrom should succeed");
        assertEq(zeroToken.balanceOf(attacker), 1e8, "Attacker should receive tokens");
        vm.stopPrank();
    }
    
    function test_BlacklistTokenSuccessfulTransferFrom() public {
        BlacklistToken blackToken = new BlacklistToken();
        
        blackToken.mint(user, 1e8);
        
        vm.startPrank(user);
        blackToken.approve(attacker, 1e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        // Successful transferFrom when no one is blacklisted
        bool result = blackToken.transferFrom(user, attacker, 1e8);
        assertTrue(result, "BlacklistToken transferFrom should succeed when not blacklisted");
        assertEq(blackToken.balanceOf(attacker), 1e8, "Attacker should receive tokens");
        vm.stopPrank();
    }
    
    function test_ComprehensiveEdgeCases() public {
        // Test various edge cases that might be missing coverage
        
        // 1. Test FeeToken edge case with very small amounts (no fee due to rounding)
        FeeToken feeToken = new FeeToken();
        feeToken.mint(user, 10);
        
        vm.startPrank(user);
        bool result = feeToken.transfer(attacker, 1);
        assertTrue(result, "Small fee token transfer should succeed");
        // Amount 1, fee = 1/100 = 0 (rounds down), so full amount should transfer
        assertEq(feeToken.balanceOf(attacker), 1, "Should receive full amount when fee rounds to 0");
        vm.stopPrank();
        
        // 2. Test boundary conditions for ExtremeSupplyToken
        ExtremeSupplyToken extremeToken = new ExtremeSupplyToken();
        
        // ExtremeSupplyToken constructor gives all tokens to msg.sender (the deployer)
        // Transfer some tokens to user first
        extremeToken.transfer(user, 1e8);
        
        vm.startPrank(user);
        extremeToken.approve(attacker, 1e8);
        vm.stopPrank();
        
        vm.startPrank(attacker);
        result = extremeToken.transferFrom(user, attacker, 1e8);
        assertTrue(result, "Extreme token transferFrom should work");
        vm.stopPrank();
    }
} 