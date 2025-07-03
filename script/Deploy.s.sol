// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import your current contracts
import {SovaBTC} from "../src/SovaBTC.sol";
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";
import {RedemptionQueue} from "../src/RedemptionQueue.sol";
import {SovaBTCStaking} from "../src/staking/SovaBTCStaking.sol";
import {SOVAToken} from "../src/staking/SOVAToken.sol";
import {TokenWhitelist} from "../src/TokenWhitelist.sol";
import {CustodyManager} from "../src/CustodyManager.sol";

/// @notice Clean deployment script for SovaBTC ecosystem on Base Sepolia
contract DeploySovaBTC is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== SovaBTC Deployment on Base Sepolia ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        // 1. Deploy SovaBTC Token
        SovaBTC sovaBTC = new SovaBTC();
        console.log("SovaBTC deployed at:", address(sovaBTC));

        // 2. Deploy SOVA Token (for staking rewards)
        // Parameters: name, symbol, initialOwner, initialSupply
        SOVAToken sovaToken = new SOVAToken("SOVA Token", "SOVA", deployer, 1000000 * 1e18); // 1M initial supply
        console.log("SOVAToken deployed at:", address(sovaToken));

        // 3. Deploy TokenWhitelist
        TokenWhitelist tokenWhitelist = new TokenWhitelist();
        console.log("TokenWhitelist deployed at:", address(tokenWhitelist));

        // 4. Deploy CustodyManager
        // Parameters: admin address
        CustodyManager custodyManager = new CustodyManager(deployer);
        console.log("CustodyManager deployed at:", address(custodyManager));

        // 5. Deploy SovaBTCWrapper (main wrapper contract)
        // Parameters: sovaBTC, tokenWhitelist, custodyManager, minDepositSatoshi
        SovaBTCWrapper wrapper = new SovaBTCWrapper(
            address(sovaBTC),
            address(tokenWhitelist),
            address(custodyManager),
            10_000 // 10,000 sats minimum deposit
        );
        console.log("SovaBTCWrapper deployed at:", address(wrapper));

        // 6. Deploy RedemptionQueue
        // Parameters: sovaBTC, tokenWhitelist, redemptionDelay
        RedemptionQueue redemptionQueue = new RedemptionQueue(
            address(sovaBTC),
            address(tokenWhitelist),
            10 days // 10 day redemption delay
        );
        console.log("RedemptionQueue deployed at:", address(redemptionQueue));

        // 7. Deploy SovaBTCStaking
        // Parameters: feeRecipient
        SovaBTCStaking staking = new SovaBTCStaking(deployer);
        console.log("SovaBTCStaking deployed at:", address(staking));

        // 8. Deploy test tokens for Base Sepolia testing
        console.log("Deploying test tokens...");
        
        TestToken wbtc = new TestToken("Mock Wrapped Bitcoin", "WBTC", 8);
        TestToken lbtc = new TestToken("Mock Liquid Bitcoin", "LBTC", 8);
        TestToken usdc = new TestToken("Mock USD Coin", "USDC", 6);
        
        console.log("Test WBTC deployed at:", address(wbtc));
        console.log("Test LBTC deployed at:", address(lbtc));
        console.log("Test USDC deployed at:", address(usdc));

        // 9. Mint test tokens to deployer for testing
        wbtc.mint(deployer, 1000 * 10**8);  // 1000 WBTC
        lbtc.mint(deployer, 1000 * 10**8);  // 1000 LBTC
        usdc.mint(deployer, 100000 * 10**6); // 100,000 USDC
        console.log("Minted test tokens to deployer");

        // 10. Initialize contracts and set up basic configuration
        // Note: You'll need to add initialize functions or configure via setters
        // depending on your contract implementations
        
        console.log("Setting up basic configuration...");
        
        // Example configuration calls (adjust based on your contract interfaces):
        // wrapper.initialize(address(sovaBTC));
        // redemptionQueue.initialize(address(sovaBTC));
        // staking.initialize(address(sovaBTC), address(sovaToken));

        vm.stopBroadcast();

        // 11. Output essential deployment information
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("SovaBTC:", address(sovaBTC));
        console.log("SOVAToken:", address(sovaToken));
        console.log("TokenWhitelist:", address(tokenWhitelist));
        console.log("CustodyManager:", address(custodyManager));
        console.log("SovaBTCWrapper:", address(wrapper));
        console.log("RedemptionQueue:", address(redemptionQueue));
        console.log("SovaBTCStaking:", address(staking));
        console.log("");
        console.log("Test Tokens:");
        console.log("WBTC:", address(wbtc));
        console.log("LBTC:", address(lbtc));
        console.log("USDC:", address(usdc));
        console.log("");
        console.log("Next steps:");
        console.log("1. Add test tokens to wrapper whitelist");
        console.log("2. Configure custody addresses if needed");
        console.log("3. Set up staking pools");
        console.log("4. Test deposit/withdrawal flows");
    }
}

/// @notice Simple test token for Base Sepolia testing
contract TestToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
}