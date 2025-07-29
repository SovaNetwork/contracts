// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test, console} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

import "../src/staking/DualTokenStaking.sol";

contract DualTokenStakingTest is Test {
    DualTokenStaking public staking;
    ERC20Mock public sovaBTC;
    ERC20Mock public sova;
    
    address public owner;
    address public user1;
    address public user2;

    event SovaBTCStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event SovaStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event RewardsClaimed(address indexed user, uint256 sovaBTCRewards, uint256 sovaRewards);

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy mock tokens
        sovaBTC = new ERC20Mock();
        sova = new ERC20Mock();

        // Deploy staking contract
        vm.startPrank(owner);
        
        DualTokenStaking stakingImpl = new DualTokenStaking();
        bytes memory stakingInitData = abi.encodeCall(
            DualTokenStaking.initialize, 
            (owner, address(sovaBTC), address(sova))
        );
        ERC1967Proxy stakingProxy = new ERC1967Proxy(address(stakingImpl), stakingInitData);
        staking = DualTokenStaking(address(stakingProxy));

        vm.stopPrank();

        // Mint tokens to users
        sovaBTC.mint(user1, 10 * 10**8);
        sovaBTC.mint(user2, 5 * 10**8);
        sova.mint(user1, 1000 * 10**18);
        sova.mint(user2, 500 * 10**18);

        // Mint reward tokens to owner
        sovaBTC.mint(owner, 100 * 10**8);
        sova.mint(owner, 10000 * 10**18);

        // Add rewards to staking contract
        vm.startPrank(owner);
        sovaBTC.approve(address(staking), 100 * 10**8);
        sova.approve(address(staking), 10000 * 10**18);
        staking.addRewards(100 * 10**8, 10000 * 10**18);
        vm.stopPrank();
    }

    function testInitialization() public view {
        assertEq(address(staking.sovaBTC()), address(sovaBTC));
        assertEq(address(staking.sova()), address(sova));
        assertEq(staking.owner(), owner);

        IDualTokenStaking.RewardRate memory rates = staking.getRewardRates();
        assertEq(rates.sovaBTCToSovaRate, 100);
        assertEq(rates.sovaToSovaBTCRate, 50);
        assertEq(rates.dualStakeMultiplier, 5000);
    }

    function testStakeSovaBTC() public {
        uint256 stakeAmount = 1 * 10**8;
        uint256 lockPeriod = 30 days;

        vm.startPrank(user1);
        sovaBTC.approve(address(staking), stakeAmount);

        vm.expectEmit(true, false, false, true);
        emit SovaBTCStaked(user1, stakeAmount, lockPeriod);

        staking.stakeSovaBTC(stakeAmount, lockPeriod);
        vm.stopPrank();

        // Check stake info
        IDualTokenStaking.StakeInfo memory stakeInfo = staking.getStakeInfo(user1);
        assertEq(stakeInfo.sovaBTCAmount, stakeAmount);
        assertEq(stakeInfo.sovaAmount, 0);
        assertEq(stakeInfo.lockEndTime, block.timestamp + lockPeriod);

        // Check total staked
        assertEq(staking.totalSovaBTCStaked(), stakeAmount);
        assertEq(sovaBTC.balanceOf(address(staking)), stakeAmount + 100 * 10**8); // includes rewards
    }

    function testStakeSova() public {
        uint256 stakeAmount = 100 * 10**18;
        uint256 lockPeriod = 90 days;

        vm.startPrank(user1);
        sova.approve(address(staking), stakeAmount);

        vm.expectEmit(true, false, false, true);
        emit SovaStaked(user1, stakeAmount, lockPeriod);

        staking.stakeSova(stakeAmount, lockPeriod);
        vm.stopPrank();

        // Check stake info
        IDualTokenStaking.StakeInfo memory stakeInfo = staking.getStakeInfo(user1);
        assertEq(stakeInfo.sovaBTCAmount, 0);
        assertEq(stakeInfo.sovaAmount, stakeAmount);
        assertEq(stakeInfo.lockEndTime, block.timestamp + lockPeriod);

        // Check total staked
        assertEq(staking.totalSovaStaked(), stakeAmount);
    }

    function testStakeBothTokens() public {
        uint256 sovaBTCAmount = 1 * 10**8;
        uint256 sovaAmount = 100 * 10**18;
        uint256 lockPeriod = 180 days;

        vm.startPrank(user1);
        sovaBTC.approve(address(staking), sovaBTCAmount);
        sova.approve(address(staking), sovaAmount);

        staking.stakeSovaBTC(sovaBTCAmount, lockPeriod);
        staking.stakeSova(sovaAmount, lockPeriod);
        vm.stopPrank();

        // Check stake info
        IDualTokenStaking.StakeInfo memory stakeInfo = staking.getStakeInfo(user1);
        assertEq(stakeInfo.sovaBTCAmount, sovaBTCAmount);
        assertEq(stakeInfo.sovaAmount, sovaAmount);
        assertEq(stakeInfo.lockEndTime, block.timestamp + lockPeriod);
    }

    function testStakeInvalidLockPeriod() public {
        uint256 stakeAmount = 1 * 10**8;
        uint256 invalidLockPeriod = 999 days; // Not in the predefined lock periods

        vm.startPrank(user1);
        sovaBTC.approve(address(staking), stakeAmount);

        vm.expectRevert(IDualTokenStaking.InvalidLockPeriod.selector);
        staking.stakeSovaBTC(stakeAmount, invalidLockPeriod);
        vm.stopPrank();
    }

    function testStakeMinimumAmount() public {
        uint256 belowMinimum = 999; // Below MIN_STAKE_AMOUNT (1000)

        vm.startPrank(user1);
        sovaBTC.approve(address(staking), belowMinimum);

        vm.expectRevert(IDualTokenStaking.ZeroAmount.selector);
        staking.stakeSovaBTC(belowMinimum, 0);
        vm.stopPrank();
    }

    function testUnstakeSovaBTC() public {
        uint256 stakeAmount = 1 * 10**8;
        uint256 lockPeriod = 0; // No lock period

        // Stake first
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), stakeAmount);
        staking.stakeSovaBTC(stakeAmount, lockPeriod);

        // Unstake
        staking.unstakeSovaBTC(stakeAmount);
        vm.stopPrank();

        // Check stake info
        IDualTokenStaking.StakeInfo memory stakeInfo = staking.getStakeInfo(user1);
        assertEq(stakeInfo.sovaBTCAmount, 0);

        // Check balance returned
        assertEq(sovaBTC.balanceOf(user1), 10 * 10**8); // Original amount
    }

    function testUnstakeBeforeLockExpiry() public {
        uint256 stakeAmount = 1 * 10**8;
        uint256 lockPeriod = 30 days;

        // Stake with lock period
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), stakeAmount);
        staking.stakeSovaBTC(stakeAmount, lockPeriod);

        // Try to unstake before lock expiry
        vm.expectRevert(IDualTokenStaking.StillLocked.selector);
        staking.unstakeSovaBTC(stakeAmount);
        vm.stopPrank();
    }

    function testUnstakeAfterLockExpiry() public {
        uint256 stakeAmount = 1 * 10**8;
        uint256 lockPeriod = 30 days;

        // Stake with lock period
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), stakeAmount);
        staking.stakeSovaBTC(stakeAmount, lockPeriod);

        // Fast forward past lock period
        vm.warp(block.timestamp + lockPeriod + 1);

        // Should be able to unstake now
        staking.unstakeSovaBTC(stakeAmount);
        vm.stopPrank();

        assertEq(sovaBTC.balanceOf(user1), 10 * 10**8);
    }

    function testRewardAccrual() public {
        uint256 sovaBTCStakeAmount = 1 * 10**8;
        uint256 sovaStakeAmount = 100 * 10**18;

        // Stake both tokens
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), sovaBTCStakeAmount);
        sova.approve(address(staking), sovaStakeAmount);

        staking.stakeSovaBTC(sovaBTCStakeAmount, 0);
        staking.stakeSova(sovaStakeAmount, 0);
        vm.stopPrank();

        // Fast forward some time
        vm.warp(block.timestamp + 30 days);

        // Check pending rewards
        (uint256 sovaBTCRewards, uint256 sovaRewards) = staking.getPendingRewards(user1);
        
        // Should have some rewards (exact calculation depends on rates)
        assertGt(sovaBTCRewards, 0);
        assertGt(sovaRewards, 0);
    }

    function testClaimRewards() public {
        uint256 sovaBTCStakeAmount = 1 * 10**8;

        // Stake SovaBTC
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), sovaBTCStakeAmount);
        staking.stakeSovaBTC(sovaBTCStakeAmount, 0);

        // Fast forward some time
        vm.warp(block.timestamp + 30 days);

        // Claim rewards
        uint256 initialSovaBalance = sova.balanceOf(user1);
        staking.claimRewards();
        vm.stopPrank();

        // Should have received SOVA rewards
        assertGt(sova.balanceOf(user1), initialSovaBalance);
    }

    function testCompound() public {
        uint256 sovaBTCStakeAmount = 1 * 10**8;

        // Stake SovaBTC
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), sovaBTCStakeAmount);
        staking.stakeSovaBTC(sovaBTCStakeAmount, 0);

        // Fast forward some time
        vm.warp(block.timestamp + 30 days);

        // Get initial stake amount
        IDualTokenStaking.StakeInfo memory initialStake = staking.getStakeInfo(user1);

        // Compound rewards
        staking.compound();
        vm.stopPrank();

        // Check that stakes increased
        IDualTokenStaking.StakeInfo memory finalStake = staking.getStakeInfo(user1);
        assertGt(finalStake.sovaAmount, initialStake.sovaAmount);
    }

    function testEmergencyUnstake() public {
        uint256 sovaBTCStakeAmount = 1 * 10**8;
        uint256 sovaStakeAmount = 100 * 10**18;
        uint256 lockPeriod = 365 days;

        // Stake both tokens with long lock period
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), sovaBTCStakeAmount);
        sova.approve(address(staking), sovaStakeAmount);
        
        staking.stakeSovaBTC(sovaBTCStakeAmount, lockPeriod);
        staking.stakeSova(sovaStakeAmount, lockPeriod);

        // Emergency unstake (should work even during lock period but with penalty)
        uint256 initialSovaBTCBalance = sovaBTC.balanceOf(user1);
        uint256 initialSovaBalance = sova.balanceOf(user1);

        staking.emergencyUnstake();
        vm.stopPrank();

        // Should get back tokens minus penalty
        assertGt(sovaBTC.balanceOf(user1), initialSovaBTCBalance);
        assertGt(sova.balanceOf(user1), initialSovaBalance);
        
        // But less than full amount due to penalty
        assertLt(sovaBTC.balanceOf(user1), initialSovaBTCBalance + sovaBTCStakeAmount);
        assertLt(sova.balanceOf(user1), initialSovaBalance + sovaStakeAmount);
    }

    function testSetRewardRates() public {
        uint256 newSovaBTCToSovaRate = 200;
        uint256 newSovaToSovaBTCRate = 100;
        uint256 newDualStakeMultiplier = 7500;

        vm.prank(owner);
        staking.setRewardRates(newSovaBTCToSovaRate, newSovaToSovaBTCRate, newDualStakeMultiplier);

        IDualTokenStaking.RewardRate memory rates = staking.getRewardRates();
        assertEq(rates.sovaBTCToSovaRate, newSovaBTCToSovaRate);
        assertEq(rates.sovaToSovaBTCRate, newSovaToSovaBTCRate);
        assertEq(rates.dualStakeMultiplier, newDualStakeMultiplier);
    }

    function testSetRewardRatesOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        staking.setRewardRates(200, 100, 7500);
    }

    function testSetInvalidRewardRates() public {
        vm.prank(owner);
        vm.expectRevert(IDualTokenStaking.InvalidRewardRate.selector);
        staking.setRewardRates(100, 50, 60000); // Over 500% bonus
    }

    function testDualStakeBonus() public {
        uint256 sovaBTCStakeAmount = 1 * 10**8;
        uint256 sovaStakeAmount = 100 * 10**18;

        // User1: Stake both tokens (dual stake bonus)
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), sovaBTCStakeAmount);
        sova.approve(address(staking), sovaStakeAmount);
        staking.stakeSovaBTC(sovaBTCStakeAmount, 0);
        staking.stakeSova(sovaStakeAmount, 0);
        vm.stopPrank();

        // User2: Stake only SovaBTC (no dual stake bonus)
        vm.startPrank(user2);
        sovaBTC.approve(address(staking), sovaBTCStakeAmount);
        staking.stakeSovaBTC(sovaBTCStakeAmount, 0);
        vm.stopPrank();

        // Fast forward time
        vm.warp(block.timestamp + 30 days);

        // Check rewards - user1 should have higher rewards due to dual stake bonus
        (uint256 user1SovaBTCRewards, uint256 user1SovaRewards) = staking.getPendingRewards(user1);
        (uint256 user2SovaBTCRewards, uint256 user2SovaRewards) = staking.getPendingRewards(user2);

        // User1 should have higher SOVA rewards due to dual stake bonus
        assertGt(user1SovaRewards, user2SovaRewards);
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        staking.pause();

        // Should not be able to stake when paused
        vm.startPrank(user1);
        sovaBTC.approve(address(staking), 1000);
        vm.expectRevert();
        staking.stakeSovaBTC(1000, 0);
        vm.stopPrank();

        // Unpause
        vm.prank(owner);
        staking.unpause();

        // Should work after unpause
        vm.startPrank(user1);
        staking.stakeSovaBTC(1000, 0);
        vm.stopPrank();
    }
}