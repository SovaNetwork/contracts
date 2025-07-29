// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

import "../src/wrapper/SovaBTCToken.sol";
import "../src/wrapper/SovaBTCWrapper.sol";

contract SovaBTCWrapperTest is Test {
    SovaBTCToken public sovaBTC;
    SovaBTCWrapper public wrapper;
    ERC20Mock public wbtc;
    ERC20Mock public cbbtc;
    
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant QUEUE_DURATION = 7 days;
    uint256 public constant WBTC_DECIMALS = 8;
    uint256 public constant CBBTC_DECIMALS = 8;

    event TokenAdded(address indexed token, string name, uint8 decimals);
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 sovaBTCMinted);
    event RedemptionRequested(uint256 indexed requestId, address indexed user, uint256 amount, address preferredToken);

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy mock tokens with 8 decimals (like real BTC tokens)
        wbtc = new ERC20Mock();
        cbbtc = new ERC20Mock();
        
        // Set up mock tokens to return 8 decimals
        vm.mockCall(address(wbtc), abi.encodeWithSignature("decimals()"), abi.encode(uint8(8)));
        vm.mockCall(address(cbbtc), abi.encodeWithSignature("decimals()"), abi.encode(uint8(8)));

        // Deploy SovaBTC token
        vm.startPrank(owner);
        
        SovaBTCToken sovaBTCImpl = new SovaBTCToken();
        bytes memory sovaBTCInitData = abi.encodeCall(SovaBTCToken.initialize, (owner));
        ERC1967Proxy sovaBTCProxy = new ERC1967Proxy(address(sovaBTCImpl), sovaBTCInitData);
        sovaBTC = SovaBTCToken(address(sovaBTCProxy));

        // Deploy wrapper contract
        SovaBTCWrapper wrapperImpl = new SovaBTCWrapper();
        bytes memory wrapperInitData = abi.encodeCall(
            SovaBTCWrapper.initialize, 
            (owner, address(sovaBTC), QUEUE_DURATION)
        );
        ERC1967Proxy wrapperProxy = new ERC1967Proxy(address(wrapperImpl), wrapperInitData);
        wrapper = SovaBTCWrapper(address(wrapperProxy));

        // Set wrapper in token contract
        sovaBTC.setWrapper(address(wrapper));

        vm.stopPrank();

        // Mint tokens to users (larger amounts to meet minimum requirements)
        wbtc.mint(user1, 100 * 10**WBTC_DECIMALS);
        wbtc.mint(user2, 50 * 10**WBTC_DECIMALS);
        cbbtc.mint(user1, 80 * 10**CBBTC_DECIMALS);
    }

    function testInitialization() public view {
        assertEq(sovaBTC.name(), "Sova Wrapped Bitcoin");
        assertEq(sovaBTC.symbol(), "sovaBTC");
        assertEq(sovaBTC.decimals(), 8);
        assertEq(sovaBTC.owner(), owner);
        
        assertEq(address(wrapper.sovaBTC()), address(sovaBTC));
        assertEq(wrapper.queueDuration(), QUEUE_DURATION);
        assertEq(wrapper.owner(), owner);
    }

    function testAddSupportedToken() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit TokenAdded(address(wbtc), "Wrapped Bitcoin", uint8(WBTC_DECIMALS));
        
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");
        
        assertTrue(wrapper.isTokenSupported(address(wbtc)));
        
        ISovaBTCWrapper.SupportedToken memory tokenInfo = wrapper.getSupportedToken(address(wbtc));
        assertTrue(tokenInfo.isSupported);
        assertEq(tokenInfo.decimals, uint8(WBTC_DECIMALS));
        assertEq(tokenInfo.name, "Wrapped Bitcoin");
        assertEq(tokenInfo.totalDeposited, 0);
    }

    function testAddSupportedTokenOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");
    }

    function testDeposit() public {
        // Add WBTC as supported token
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        uint256 depositAmount = 1 * 10**WBTC_DECIMALS;
        
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        
        vm.expectEmit(true, true, false, true);
        emit Deposit(user1, address(wbtc), depositAmount, depositAmount);
        
        wrapper.deposit(address(wbtc), depositAmount);
        vm.stopPrank();

        // Check balances
        assertEq(sovaBTC.balanceOf(user1), depositAmount);
        assertEq(wbtc.balanceOf(address(wrapper)), depositAmount);
        
        // Check wrapper state
        ISovaBTCWrapper.SupportedToken memory tokenInfo = wrapper.getSupportedToken(address(wbtc));
        assertEq(tokenInfo.totalDeposited, depositAmount);
    }

    function testDepositUnsupportedToken() public {
        uint256 depositAmount = 1 * 10**WBTC_DECIMALS;
        
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        
        vm.expectRevert(ISovaBTCWrapper.TokenNotSupported.selector);
        wrapper.deposit(address(wbtc), depositAmount);
        vm.stopPrank();
    }

    function testDepositZeroAmount() public {
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        vm.startPrank(user1);
        vm.expectRevert(ISovaBTCWrapper.ZeroAmount.selector);
        wrapper.deposit(address(wbtc), 0);
        vm.stopPrank();
    }

    function testRequestRedemption() public {
        // Setup: deposit first
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        uint256 depositAmount = 1 * 10**WBTC_DECIMALS;
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);

        // Request redemption
        uint256 redeemAmount = depositAmount / 2;
        
        vm.expectEmit(true, true, false, true);
        emit RedemptionRequested(1, user1, redeemAmount, address(wbtc));
        
        uint256 requestId = wrapper.requestRedemption(redeemAmount, address(wbtc));
        vm.stopPrank();

        assertEq(requestId, 1);
        assertEq(sovaBTC.balanceOf(user1), depositAmount - redeemAmount);

        ISovaBTCWrapper.RedemptionRequest memory request = wrapper.getRedemptionRequest(requestId);
        assertEq(request.user, user1);
        assertEq(request.amount, redeemAmount);
        assertEq(request.preferredToken, address(wbtc));
        assertFalse(request.fulfilled);
    }

    function testRequestRedemptionInsufficientBalance() public {
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        vm.startPrank(user1);
        vm.expectRevert(ISovaBTCWrapper.InsufficientBalance.selector);
        wrapper.requestRedemption(1 * 10**8, address(wbtc));
        vm.stopPrank();
    }

    function testClaimRedemption() public {
        // Setup: deposit and request redemption
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        uint256 depositAmount = 1 * 10**WBTC_DECIMALS;
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);

        uint256 requestId = wrapper.requestRedemption(depositAmount, address(wbtc));
        vm.stopPrank();

        // Fast forward past queue duration
        vm.warp(block.timestamp + QUEUE_DURATION + 1);

        // Claim redemption
        vm.prank(user1);
        wrapper.claimRedemption(requestId);

        // Check balances
        assertEq(wbtc.balanceOf(user1), 99 * 10**WBTC_DECIMALS + depositAmount); // original - deposit + redemption
        assertEq(sovaBTC.balanceOf(user1), 0);

        // Check request is fulfilled
        ISovaBTCWrapper.RedemptionRequest memory request = wrapper.getRedemptionRequest(requestId);
        assertTrue(request.fulfilled);
    }

    function testClaimRedemptionTooEarly() public {
        // Setup: deposit and request redemption
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        uint256 depositAmount = 1 * 10**WBTC_DECIMALS;
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);

        uint256 requestId = wrapper.requestRedemption(depositAmount, address(wbtc));
        vm.stopPrank();

        // Try to claim too early
        vm.prank(user1);
        vm.expectRevert(ISovaBTCWrapper.RedemptionNotReady.selector);
        wrapper.claimRedemption(requestId);
    }

    function testAdminWithdraw() public {
        // Setup: deposit tokens
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        uint256 depositAmount = 1 * 10**WBTC_DECIMALS;
        vm.startPrank(user1);
        wbtc.approve(address(wrapper), depositAmount);
        wrapper.deposit(address(wbtc), depositAmount);
        vm.stopPrank();

        // Admin withdraw
        address treasury = makeAddr("treasury");
        uint256 withdrawAmount = depositAmount / 2;

        vm.prank(owner);
        wrapper.adminWithdraw(address(wbtc), treasury, withdrawAmount);

        assertEq(wbtc.balanceOf(treasury), withdrawAmount);
        assertEq(wbtc.balanceOf(address(wrapper)), depositAmount - withdrawAmount);
    }

    function testAdminWithdrawOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        wrapper.adminWithdraw(address(wbtc), user1, 1000);
    }

    function testSetQueueDuration() public {
        uint256 newDuration = 14 days;
        
        vm.prank(owner);
        wrapper.setQueueDuration(newDuration);
        
        assertEq(wrapper.queueDuration(), newDuration);
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        wrapper.pause();

        // Should not be able to deposit when paused
        vm.prank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");

        vm.startPrank(user1);
        wbtc.approve(address(wrapper), 10000);
        vm.expectRevert();
        wrapper.deposit(address(wbtc), 10000);
        vm.stopPrank();

        // Unpause
        vm.prank(owner);
        wrapper.unpause();

        // Should work after unpause
        vm.startPrank(user1);
        wrapper.deposit(address(wbtc), 10000);
        vm.stopPrank();
    }

    function testMultipleTokenSupport() public {
        // Add both tokens
        vm.startPrank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");
        wrapper.addSupportedToken(address(cbbtc), "Coinbase Wrapped Bitcoin");
        vm.stopPrank();

        // Deposit both tokens
        uint256 wbtcAmount = 1 * 10**WBTC_DECIMALS;
        uint256 cbbtcAmount = 2 * 10**CBBTC_DECIMALS;

        vm.startPrank(user1);
        wbtc.approve(address(wrapper), wbtcAmount);
        wrapper.deposit(address(wbtc), wbtcAmount);

        cbbtc.approve(address(wrapper), cbbtcAmount);
        wrapper.deposit(address(cbbtc), cbbtcAmount);
        vm.stopPrank();

        // Check total SovaBTC balance
        assertEq(sovaBTC.balanceOf(user1), wbtcAmount + cbbtcAmount);
    }

    function testGetSupportedTokens() public {
        // Add tokens
        vm.startPrank(owner);
        wrapper.addSupportedToken(address(wbtc), "Wrapped Bitcoin");
        wrapper.addSupportedToken(address(cbbtc), "Coinbase Wrapped Bitcoin");
        vm.stopPrank();

        assertEq(wrapper.getSupportedTokensCount(), 2);
        assertEq(wrapper.getSupportedTokenAt(0), address(wbtc));
        assertEq(wrapper.getSupportedTokenAt(1), address(cbbtc));
    }
}