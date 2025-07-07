// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import protocol contracts
import {SovaBTC} from "../src/SovaBTC.sol";
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";
import {RedemptionQueue} from "../src/RedemptionQueue.sol";
import {SovaBTCStaking} from "../src/staking/SovaBTCStaking.sol";
import {SOVAToken} from "../src/staking/SOVAToken.sol";
import {TokenWhitelist} from "../src/TokenWhitelist.sol";
import {CustodyManager} from "../src/CustodyManager.sol";

/// @notice Multi-chain deployment script for SovaBTC protocol
/// @dev Supports Ethereum Sepolia (11155111) and Optimism Sepolia (11155420)
contract DeployMultiChainSovaBTC is Script {
    // Protocol parameters
    uint256 constant MIN_DEPOSIT_SATOSHI = 10_000; // 10,000 sats
    uint256 constant REDEMPTION_DELAY = 10 days;
    uint256 constant INITIAL_SOVA_SUPPLY = 1_000_000 * 1e18; // 1M SOVA tokens

    // Test token parameters
    uint256 constant TEST_WBTC_MINT = 1000 * 10**8;  // 1000 WBTC
    uint256 constant TEST_LBTC_MINT = 1000 * 10**8;  // 1000 LBTC  
    uint256 constant TEST_USDC_MINT = 100_000 * 10**6; // 100,000 USDC

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== SovaBTC Multi-Chain Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Network:", getNetworkName(block.chainid));
        console.log("");

        // Deploy all protocol contracts
        (
            address sovaBTC,
            address sovaToken,
            address tokenWhitelist,
            address custodyManager,
            address wrapper,
            address redemptionQueue,
            address staking
        ) = deployProtocolContracts(deployer);

        // Deploy and configure test tokens
        (address wbtc, address lbtc, address usdc) = deployTestTokens(deployer);

        // Set up basic configuration
        setupProtocolConfiguration(
            TokenWhitelist(tokenWhitelist),
            SovaBTCWrapper(wrapper),
            RedemptionQueue(redemptionQueue),
            wbtc,
            lbtc, 
            usdc,
            deployer
        );

        vm.stopBroadcast();

        // Output deployment information
        outputDeploymentInfo(
            block.chainid,
            sovaBTC,
            sovaToken,
            tokenWhitelist,
            custodyManager,
            wrapper,
            redemptionQueue,
            staking,
            wbtc,
            lbtc,
            usdc
        );
    }

    function deployProtocolContracts(address deployer) internal returns (
        address sovaBTC,
        address sovaToken,
        address tokenWhitelist,
        address custodyManager,
        address wrapper,
        address redemptionQueue,
        address staking
    ) {
        console.log("Deploying protocol contracts...");

        // 1. Deploy SovaBTC Token
        SovaBTC sovaBTCContract = new SovaBTC();
        sovaBTC = address(sovaBTCContract);
        console.log("SovaBTC deployed at:", sovaBTC);

        // 2. Deploy SOVA Token
        SOVAToken sovaTokenContract = new SOVAToken(
            "SOVA Token", 
            "SOVA", 
            deployer, 
            INITIAL_SOVA_SUPPLY
        );
        sovaToken = address(sovaTokenContract);
        console.log("SOVAToken deployed at:", sovaToken);

        // 3. Deploy TokenWhitelist
        TokenWhitelist tokenWhitelistContract = new TokenWhitelist();
        tokenWhitelist = address(tokenWhitelistContract);
        console.log("TokenWhitelist deployed at:", tokenWhitelist);

        // 4. Deploy CustodyManager
        CustodyManager custodyManagerContract = new CustodyManager(deployer);
        custodyManager = address(custodyManagerContract);
        console.log("CustodyManager deployed at:", custodyManager);

        // 5. Deploy SovaBTCWrapper
        SovaBTCWrapper wrapperContract = new SovaBTCWrapper(
            sovaBTC,
            tokenWhitelist,
            custodyManager,
            MIN_DEPOSIT_SATOSHI
        );
        wrapper = address(wrapperContract);
        console.log("SovaBTCWrapper deployed at:", wrapper);

        // 6. Deploy RedemptionQueue
        RedemptionQueue redemptionQueueContract = new RedemptionQueue(
            sovaBTC,
            tokenWhitelist,
            REDEMPTION_DELAY
        );
        redemptionQueue = address(redemptionQueueContract);
        console.log("RedemptionQueue deployed at:", redemptionQueue);

        // 7. Deploy SovaBTCStaking
        SovaBTCStaking stakingContract = new SovaBTCStaking(deployer);
        staking = address(stakingContract);
        console.log("SovaBTCStaking deployed at:", staking);

        // 8. Set up minter roles for wrapper and redemption queue
        sovaBTCContract.setMinter(wrapper, true);
        sovaBTCContract.setMinter(redemptionQueue, true);
        console.log("Added minter roles for wrapper and redemption queue");

        console.log("");
    }

    function deployTestTokens(address deployer) internal returns (
        address wbtc,
        address lbtc, 
        address usdc
    ) {
        console.log("Deploying test tokens...");

        // Deploy test tokens
        TestToken wbtcContract = new TestToken("Test Wrapped Bitcoin", "WBTC", 8);
        TestToken lbtcContract = new TestToken("Test Liquid Bitcoin", "LBTC", 8);
        TestToken usdcContract = new TestToken("Test USD Coin", "USDC", 6);

        wbtc = address(wbtcContract);
        lbtc = address(lbtcContract);
        usdc = address(usdcContract);

        console.log("Test WBTC deployed at:", wbtc);
        console.log("Test LBTC deployed at:", lbtc);
        console.log("Test USDC deployed at:", usdc);

        // Mint test tokens to deployer
        wbtcContract.mint(deployer, TEST_WBTC_MINT);
        lbtcContract.mint(deployer, TEST_LBTC_MINT);
        usdcContract.mint(deployer, TEST_USDC_MINT);
        console.log("Minted test tokens to deployer");

        console.log("");
    }

    function setupProtocolConfiguration(
        TokenWhitelist tokenWhitelist,
        SovaBTCWrapper wrapper,
        RedemptionQueue redemptionQueue,
        address wbtc,
        address lbtc,
        address usdc,
        address deployer
    ) internal {
        console.log("Setting up protocol configuration...");

        // Add test tokens to whitelist
        tokenWhitelist.addAllowedToken(wbtc);
        tokenWhitelist.addAllowedToken(lbtc);  
        tokenWhitelist.addAllowedToken(usdc);
        console.log("Added test tokens to whitelist");

        // Set custodian for redemption queue (deployer for testing)
        redemptionQueue.setCustodian(deployer, true);
        console.log("Set deployer as custodian for redemption queue");

        // Update wrapper to use new redemption queue
        wrapper.setRedemptionQueue(address(redemptionQueue));
        console.log("Connected wrapper to redemption queue");

        console.log("");
    }

    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 11155111) return "Ethereum Sepolia";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 84532) return "Base Sepolia";
        return "Unknown Network";
    }

    function outputDeploymentInfo(
        uint256 chainId,
        address sovaBTC,
        address sovaToken,
        address tokenWhitelist,
        address custodyManager,
        address wrapper,
        address redemptionQueue,
        address staking,
        address wbtc,
        address lbtc,
        address usdc
    ) internal view {
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("Network:", getNetworkName(chainId));
        console.log("Chain ID:", chainId);
        console.log("");
        
        console.log("Protocol Contracts:");
        console.log("SovaBTC:", sovaBTC);
        console.log("SOVAToken:", sovaToken);
        console.log("TokenWhitelist:", tokenWhitelist);
        console.log("CustodyManager:", custodyManager);
        console.log("SovaBTCWrapper:", wrapper);
        console.log("RedemptionQueue:", redemptionQueue);
        console.log("SovaBTCStaking:", staking);
        console.log("");
        
        console.log("Test Tokens:");
        console.log("WBTC:", wbtc);
        console.log("LBTC:", lbtc);
        console.log("USDC:", usdc);
        console.log("");
        
        console.log("Next Steps:");
        console.log("1. Update ui/src/contracts/addresses.ts with these addresses");
        console.log("2. Test multi-chain functionality in the frontend");
        console.log("3. Verify all contracts on block explorer");
        console.log("4. Test wrap/unwrap flows on both networks");
        console.log("");
        
        // Output TypeScript-friendly format for easy copy-paste
        console.log("For addresses.ts (Chain ID", chainId, "):");
        console.log("contracts: {");
        console.log("  sovaBTC: '%s',", sovaBTC);
        console.log("  sovaToken: '%s',", sovaToken);
        console.log("  tokenWhitelist: '%s',", tokenWhitelist);
        console.log("  custodyManager: '%s',", custodyManager);
        console.log("  wrapper: '%s',", wrapper);
        console.log("  redemptionQueue: '%s',", redemptionQueue);
        console.log("  staking: '%s',", staking);
        console.log("},");
        console.log("supportedTokens: {");
        console.log("  WBTC: { address: '%s', name: 'Test Wrapped Bitcoin', symbol: 'WBTC', decimals: 8 },", wbtc);
        console.log("  LBTC: { address: '%s', name: 'Test Liquid Bitcoin', symbol: 'LBTC', decimals: 8 },", lbtc);
        console.log("  USDC: { address: '%s', name: 'Test USD Coin', symbol: 'USDC', decimals: 6 },", usdc);
        console.log("}");
    }
}

/// @notice Simple test token for multi-chain testing
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