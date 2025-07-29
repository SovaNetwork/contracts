// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

import "../src/vault/SovaBTCYieldVault.sol";
import "../src/staking/SovaBTCYieldStaking.sol";
import "../src/bridges/BridgedSovaBTC.sol";

contract SovaBTCYieldSystemTest is Test {
    SovaBTCYieldVault public vault;
    SovaBTCYieldStaking public staking;
    BridgedSovaBTC public bridgedSovaBTC;
    ERC20Mock public wbtc;
    ERC20Mock public sova;

    address public owner;
    address public user1;
    address public user2;
    address public hyperlaneMailbox;

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        hyperlaneMailbox = makeAddr("hyperlaneMailbox");

        // Deploy mock tokens with 8 decimals (like real BTC tokens)
        wbtc = new ERC20Mock();
        sova = new ERC20Mock();

        // Set up mock tokens to return 8 decimals for WBTC, 18 for SOVA
        vm.mockCall(address(wbtc), abi.encodeWithSignature("decimals()"), abi.encode(uint8(8)));
        vm.mockCall(address(sova), abi.encodeWithSignature("decimals()"), abi.encode(uint8(18)));
        vm.mockCall(address(wbtc), abi.encodeWithSignature("name()"), abi.encode("Wrapped Bitcoin"));
        vm.mockCall(address(sova), abi.encodeWithSignature("name()"), abi.encode("SOVA Token"));

        vm.startPrank(owner);

        // Deploy BridgedSovaBTC
        BridgedSovaBTC bridgedImpl = new BridgedSovaBTC();
        bytes memory bridgedInitData = abi.encodeCall(BridgedSovaBTC.initialize, (owner, hyperlaneMailbox, address(0)));
        ERC1967Proxy bridgedProxy = new ERC1967Proxy(address(bridgedImpl), bridgedInitData);
        bridgedSovaBTC = BridgedSovaBTC(address(bridgedProxy));

        // Deploy Yield Vault
        SovaBTCYieldVault vaultImpl = new SovaBTCYieldVault();
        bytes memory vaultInitData = abi.encodeCall(
            SovaBTCYieldVault.initialize,
            (
                address(wbtc), // underlying asset
                address(bridgedSovaBTC), // reward token
                false, // not Sova Network
                owner, // owner
                "SovaBTC Yield Vault", // name
                "sovaBTCYield" // symbol
            )
        );
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultInitData);
        vault = SovaBTCYieldVault(address(vaultProxy));

        // Deploy Yield Staking
        SovaBTCYieldStaking stakingImpl = new SovaBTCYieldStaking();
        bytes memory stakingInitData = abi.encodeCall(
            SovaBTCYieldStaking.initialize,
            (
                owner, // owner
                address(vault), // vault token
                address(sova), // SOVA token
                address(bridgedSovaBTC), // reward token
                false // not Sova Network
            )
        );
        ERC1967Proxy stakingProxy = new ERC1967Proxy(address(stakingImpl), stakingInitData);
        staking = SovaBTCYieldStaking(address(stakingProxy));

        // Grant vault role to vault contract
        bridgedSovaBTC.grantVaultRole(address(vault));

        vm.stopPrank();

        // Mint tokens to users
        wbtc.mint(user1, 100 * 10 ** 8); // 100 WBTC
        wbtc.mint(user2, 50 * 10 ** 8); // 50 WBTC
        sova.mint(user1, 1000 * 10 ** 18); // 1000 SOVA
        sova.mint(user2, 500 * 10 ** 18); // 500 SOVA

        // Mint reward tokens to owner for distribution
        vm.startPrank(owner);
        bridgedSovaBTC.grantVaultRole(owner); // Grant owner vault role for minting
        bridgedSovaBTC.mint(owner, 100 * 10 ** 8); // 100 bridged sovaBTC
        vm.stopPrank();
    }

    function testVaultDeployment() public view {
        assertEq(vault.name(), "SovaBTC Yield Vault");
        assertEq(vault.symbol(), "sovaBTCYield");
        assertEq(vault.decimals(), 8);
        assertEq(vault.owner(), owner);
        assertEq(address(vault.asset()), address(wbtc));
        assertEq(address(vault.rewardToken()), address(bridgedSovaBTC));
        assertFalse(vault.isSovaNetwork());
    }

    function testStakingDeployment() public view {
        assertEq(staking.owner(), owner);
        assertEq(address(staking.vaultToken()), address(vault));
        assertEq(address(staking.sovaToken()), address(sova));
        assertEq(address(staking.rewardToken()), address(bridgedSovaBTC));
        assertFalse(staking.isSovaNetwork());
    }

    function testDepositToVault() public {
        uint256 depositAmount = 1 * 10 ** 8; // 1 WBTC

        vm.startPrank(user1);
        wbtc.approve(address(vault), depositAmount);

        uint256 sharesBefore = vault.balanceOf(user1);
        vault.deposit(depositAmount, user1);
        uint256 sharesAfter = vault.balanceOf(user1);

        vm.stopPrank();

        assertGt(sharesAfter, sharesBefore);
        assertEq(vault.totalAssets(), depositAmount);
    }

    function testDepositAssetToVault() public {
        uint256 depositAmount = 1 * 10 ** 8; // 1 WBTC

        vm.startPrank(user1);
        wbtc.approve(address(vault), depositAmount);

        uint256 sharesBefore = vault.balanceOf(user1);
        uint256 sharesReceived = vault.depositAsset(address(wbtc), depositAmount, user1);
        uint256 sharesAfter = vault.balanceOf(user1);

        vm.stopPrank();

        assertGt(sharesReceived, 0, "Should receive vault shares");
        assertEq(sharesAfter, sharesBefore + sharesReceived, "Balance should increase by shares received");
        assertTrue(vault.isAssetSupported(address(wbtc)));
    }

    function testStakeVaultTokens() public {
        // First deposit to vault
        uint256 depositAmount = 1 * 10 ** 8;
        vm.startPrank(user1);
        wbtc.approve(address(vault), depositAmount);
        uint256 vaultShares = vault.deposit(depositAmount, user1);

        // Then stake vault tokens
        vault.approve(address(staking), vaultShares);
        staking.stakeVaultTokens(vaultShares, 0); // No lock period

        vm.stopPrank();

        SovaBTCYieldStaking.UserStake memory userStake = staking.getUserStake(user1);
        assertEq(userStake.vaultTokenAmount, vaultShares);
        assertEq(staking.totalVaultTokensStaked(), vaultShares);
    }

    function testDualStaking() public {
        // Deposit to vault and stake vault tokens
        uint256 depositAmount = 1 * 10 ** 8;
        vm.startPrank(user1);
        wbtc.approve(address(vault), depositAmount);
        uint256 vaultShares = vault.deposit(depositAmount, user1);

        vault.approve(address(staking), vaultShares);
        staking.stakeVaultTokens(vaultShares, 0);

        // Stake SOVA tokens
        uint256 sovaAmount = 100 * 10 ** 18;
        sova.approve(address(staking), sovaAmount);
        staking.stakeSova(sovaAmount, 0);

        vm.stopPrank();

        SovaBTCYieldStaking.UserStake memory userStake = staking.getUserStake(user1);
        assertEq(userStake.vaultTokenAmount, vaultShares);
        assertEq(userStake.sovaAmount, sovaAmount);
    }

    function testCannotStakeSovaWithoutVaultTokens() public {
        uint256 sovaAmount = 100 * 10 ** 18;

        vm.startPrank(user1);
        sova.approve(address(staking), sovaAmount);

        vm.expectRevert(SovaBTCYieldStaking.RequireVaultTokenStake.selector);
        staking.stakeSova(sovaAmount, 0);

        vm.stopPrank();
    }

    function testAddYieldToVault() public {
        // First deposit to vault
        uint256 depositAmount = 1 * 10 ** 8;
        vm.startPrank(user1);
        wbtc.approve(address(vault), depositAmount);
        vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Add yield
        uint256 yieldAmount = 10 * 10 ** 8; // 10 bridged sovaBTC
        vm.startPrank(owner);
        bridgedSovaBTC.approve(address(vault), yieldAmount);
        vault.addYield(yieldAmount);
        vm.stopPrank();

        // Exchange rate should have increased
        assertGt(vault.getCurrentExchangeRate(), 1e18); // Greater than 1:1
    }

    function testRedeemForRewards() public {
        // Setup: deposit to vault and add yield
        uint256 depositAmount = 1 * 10 ** 8;
        vm.startPrank(user1);
        wbtc.approve(address(vault), depositAmount);
        uint256 vaultShares = vault.deposit(depositAmount, user1);
        vm.stopPrank();

        // Add yield
        uint256 yieldAmount = 10 * 10 ** 8;
        vm.startPrank(owner);
        bridgedSovaBTC.approve(address(vault), yieldAmount);
        vault.addYield(yieldAmount);
        vm.stopPrank();

        // Redeem vault tokens for bridged sovaBTC
        vm.startPrank(user1);
        uint256 balanceBefore = bridgedSovaBTC.balanceOf(user1);
        vault.redeemForRewards(vaultShares, user1);
        uint256 balanceAfter = bridgedSovaBTC.balanceOf(user1);
        vm.stopPrank();

        assertGt(balanceAfter, balanceBefore);
        assertEq(vault.balanceOf(user1), 0); // Vault tokens burned
    }

    function testBridgedSovaBTCRoles() public {
        assertTrue(bridgedSovaBTC.hasRole(bridgedSovaBTC.VAULT_ROLE(), address(vault)));
        assertTrue(bridgedSovaBTC.hasRole(bridgedSovaBTC.DEFAULT_ADMIN_ROLE(), owner));
    }
}
