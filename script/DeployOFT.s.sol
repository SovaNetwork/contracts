// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

// Import LayerZero OFT contracts
import {SovaBTCOFT} from "../src/SovaBTCOFT.sol";
import {SovaBTCSova} from "../src/SovaBTCSova.sol";

// Import supporting contracts
import {SovaBTCWrapper} from "../src/SovaBTCWrapper.sol";
import {RedemptionQueue} from "../src/RedemptionQueue.sol";
import {SovaBTCStaking} from "../src/staking/SovaBTCStaking.sol";
import {SOVAToken} from "../src/staking/SOVAToken.sol";
import {TokenWhitelist} from "../src/TokenWhitelist.sol";
import {CustodyManager} from "../src/CustodyManager.sol";

/**
 * @title DeployOFTProtocol
 * @notice Deploys SovaBTC LayerZero OFT protocol across multiple chains
 * @dev Supports Ethereum Sepolia, Optimism Sepolia, Base Sepolia, and Arbitrum Sepolia
 */
contract DeployOFTProtocol is Script {
    // ============ Protocol Parameters ============
    uint256 constant MIN_DEPOSIT_SATOSHI = 10_000; // 10,000 sats
    uint256 constant REDEMPTION_DELAY = 10 days;
    uint256 constant INITIAL_SOVA_SUPPLY = 1_000_000 * 1e18; // 1M SOVA tokens

    // Test token parameters
    uint256 constant TEST_WBTC_MINT = 1000 * 10**8;  // 1000 WBTC
    uint256 constant TEST_LBTC_MINT = 1000 * 10**8;  // 1000 LBTC  
    uint256 constant TEST_USDC_MINT = 100_000 * 10**6; // 100,000 USDC

    // ============ LayerZero V2 Configuration ============
    
    struct LayerZeroConfig {
        address endpoint;
        uint32 eid;
        string name;
    }

    mapping(uint256 => LayerZeroConfig) public layerZeroConfigs;

    constructor() {
        // LayerZero V2 Testnet Endpoint Configurations
        layerZeroConfigs[11155111] = LayerZeroConfig({
            endpoint: 0x1a44076050125825900e736c501f859c50fE728c,
            eid: 40161,
            name: "Ethereum Sepolia"
        });

        layerZeroConfigs[11155420] = LayerZeroConfig({
            endpoint: 0x1a44076050125825900e736c501f859c50fE728c,
            eid: 40232,
            name: "Optimism Sepolia"
        });

        layerZeroConfigs[84532] = LayerZeroConfig({
            endpoint: 0x1a44076050125825900e736c501f859c50fE728c,
            eid: 40245,
            name: "Base Sepolia"
        });

        layerZeroConfigs[421614] = LayerZeroConfig({
            endpoint: 0x1a44076050125825900e736c501f859c50fE728c,
            eid: 40231,
            name: "Arbitrum Sepolia"
        });
    }

    // ============ Main Deployment Function ============

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);

        console.log("=== SovaBTC LayerZero OFT Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Network:", getNetworkName(block.chainid));
        console.log("LayerZero EID:", layerZeroConfigs[block.chainid].eid);
        console.log("LayerZero Endpoint:", layerZeroConfigs[block.chainid].endpoint);
        console.log("");

        // Validate LayerZero configuration exists
        require(layerZeroConfigs[block.chainid].endpoint != address(0), "LayerZero endpoint not configured for this chain");

        // Deploy all protocol contracts with OFT
        (
            address sovaBTCOFT,
            address sovaToken,
            address tokenWhitelist,
            address custodyManager,
            address wrapper,
            address redemptionQueue,
            address staking
        ) = deployOFTProtocolContracts(deployer);

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
        DeploymentAddresses memory addresses = DeploymentAddresses({
            sovaBTCOFT: sovaBTCOFT,
            sovaToken: sovaToken,
            tokenWhitelist: tokenWhitelist,
            custodyManager: custodyManager,
            wrapper: wrapper,
            redemptionQueue: redemptionQueue,
            staking: staking,
            wbtc: wbtc,
            lbtc: lbtc,
            usdc: usdc
        });
        
        outputOFTDeploymentInfo(block.chainid, addresses);
    }

    // ============ OFT Protocol Deployment ============

    function deployOFTProtocolContracts(address deployer) internal returns (
        address sovaBTCOFT,
        address sovaToken,
        address tokenWhitelist,
        address custodyManager,
        address wrapper,
        address redemptionQueue,
        address staking
    ) {
        console.log("Deploying LayerZero OFT protocol contracts...");

        LayerZeroConfig memory lzConfig = layerZeroConfigs[block.chainid];

        // 1. Deploy SovaBTC OFT (LayerZero-enabled)
        SovaBTCOFT sovaBTCOFTContract;
        
        // Check if this is Sova chain (hypothetical chain ID 1 for Sova)
        if (block.chainid == 1) {
            console.log("Deploying SovaBTCSova (with Bitcoin precompile access)...");
            SovaBTCSova sovaSovaBTCContract = new SovaBTCSova(
                lzConfig.endpoint,
                deployer // delegate
            );
            sovaBTCOFTContract = SovaBTCOFT(address(sovaSovaBTCContract));
        } else {
            console.log("Deploying SovaBTCOFT (standard LayerZero OFT)...");
            sovaBTCOFTContract = new SovaBTCOFT(
                "Sova Bitcoin",
                "sovaBTC", 
                lzConfig.endpoint,
                deployer // minter - will be updated to wrapper later
            );
        }
        
        sovaBTCOFT = address(sovaBTCOFTContract);
        console.log("SovaBTC OFT deployed at:", sovaBTCOFT);

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

        // 5. Deploy SovaBTCWrapper (compatible with OFT)
        SovaBTCWrapper wrapperContract = new SovaBTCWrapper(
            sovaBTCOFT, // Use OFT address instead of standard SovaBTC
            tokenWhitelist,
            custodyManager,
            MIN_DEPOSIT_SATOSHI
        );
        wrapper = address(wrapperContract);
        console.log("SovaBTCWrapper deployed at:", wrapper);

        // 6. Deploy RedemptionQueue (compatible with OFT)
        RedemptionQueue redemptionQueueContract = new RedemptionQueue(
            sovaBTCOFT, // Use OFT address instead of standard SovaBTC
            tokenWhitelist,
            REDEMPTION_DELAY
        );
        redemptionQueue = address(redemptionQueueContract);
        console.log("RedemptionQueue deployed at:", redemptionQueue);

        // 7. Deploy SovaBTCStaking
        SovaBTCStaking stakingContract = new SovaBTCStaking(deployer);
        staking = address(stakingContract);
        console.log("SovaBTCStaking deployed at:", staking);

        // 8. Configure OFT minter permissions
        console.log("Configuring OFT minter permissions...");
        sovaBTCOFTContract.setMinter(wrapper);
        console.log("Set wrapper as OFT minter");
        
        sovaBTCOFTContract.setMinter(redemptionQueue);
        console.log("Set redemption queue as OFT minter");

        console.log("");
    }

    // ============ Test Token Deployment ============

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

    // ============ Protocol Configuration ============

    function setupProtocolConfiguration(
        TokenWhitelist tokenWhitelist,
        SovaBTCWrapper wrapper,
        RedemptionQueue redemptionQueue,
        address wbtc,
        address lbtc,
        address usdc,
        address deployer
    ) internal {
        console.log("Setting up OFT protocol configuration...");

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

    // ============ Utility Functions ============

    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 11155111) return "Ethereum Sepolia";
        if (chainId == 11155420) return "Optimism Sepolia";
        if (chainId == 84532) return "Base Sepolia";
        if (chainId == 421614) return "Arbitrum Sepolia";
        if (chainId == 1) return "Sova Mainnet";
        return "Unknown Network";
    }

    // ============ Output Functions ============

    struct DeploymentAddresses {
        address sovaBTCOFT;
        address sovaToken;
        address tokenWhitelist;
        address custodyManager;
        address wrapper;
        address redemptionQueue;
        address staking;
        address wbtc;
        address lbtc;
        address usdc;
    }

    function outputOFTDeploymentInfo(
        uint256 chainId,
        DeploymentAddresses memory addresses
    ) internal view {
        console.log("=== LayerZero OFT DEPLOYMENT COMPLETE ===");
        console.log("");
        console.log("Network:", getNetworkName(chainId));
        console.log("Chain ID:", chainId);
        console.log("LayerZero EID:", layerZeroConfigs[chainId].eid);
        console.log("LayerZero Endpoint:", layerZeroConfigs[chainId].endpoint);
        console.log("");
        
        console.log("=== CORE OFT CONTRACTS ===");
        console.log("SovaBTC OFT:", addresses.sovaBTCOFT);
        console.log("SOVA Token:", addresses.sovaToken);
        console.log("TokenWhitelist:", addresses.tokenWhitelist);
        console.log("CustodyManager:", addresses.custodyManager);
        console.log("SovaBTCWrapper:", addresses.wrapper);
        console.log("RedemptionQueue:", addresses.redemptionQueue);
        console.log("SovaBTCStaking:", addresses.staking);
        console.log("");
        
        console.log("=== TEST TOKENS ===");
        console.log("WBTC:", addresses.wbtc);
        console.log("LBTC:", addresses.lbtc);
        console.log("USDC:", addresses.usdc);
        console.log("");
        
        console.log("=== FRONTEND CONFIGURATION ===");
        console.log("Add to ui/src/contracts/addresses.ts:");
        console.log("");
        console.log("  // %s (Chain ID: %s, LayerZero EID: %s)", getNetworkName(chainId), chainId, layerZeroConfigs[chainId].eid);
        console.log("  %s: {", chainId);
        console.log("    SOVABTC_OFT: '%s',", addresses.sovaBTCOFT);
        console.log("    SOVA_TOKEN: '%s',", addresses.sovaToken);
        console.log("    TOKEN_WHITELIST: '%s',", addresses.tokenWhitelist);
        console.log("    CUSTODY_MANAGER: '%s',", addresses.custodyManager);
        console.log("    WRAPPER: '%s',", addresses.wrapper);
        console.log("    REDEMPTION_QUEUE: '%s',", addresses.redemptionQueue);
        console.log("    STAKING: '%s',", addresses.staking);
        console.log("    // LayerZero Configuration");
        console.log("    LAYERZERO_ENDPOINT: '%s',", layerZeroConfigs[chainId].endpoint);
        console.log("    LAYERZERO_EID: %s,", layerZeroConfigs[chainId].eid);
        console.log("    // Test Tokens");
        console.log("    TEST_WBTC: '%s',", addresses.wbtc);
        console.log("    TEST_LBTC: '%s',", addresses.lbtc);
        console.log("    TEST_USDC: '%s',", addresses.usdc);
        console.log("  },");
        console.log("");
        
        console.log("=== NEXT STEPS ===");
        console.log("1. Deploy to other testnets (Ethereum Sepolia, Optimism Sepolia)");
        console.log("2. Configure cross-chain peers with script/ConfigurePeers.s.sol");
        console.log("3. Test cross-chain transfers between networks");
        console.log("4. Update frontend with bridge interface");
        console.log("5. Test complete OFT functionality end-to-end");
        console.log("");
        
        console.log("=== PEER CONFIGURATION COMMANDS ===");
        console.log("After deploying to all networks, run:");
        console.log("forge script script/ConfigurePeers.s.sol --rpc-url $ETH_SEPOLIA_RPC --broadcast");
        console.log("forge script script/ConfigurePeers.s.sol --rpc-url $OP_SEPOLIA_RPC --broadcast");
        console.log("forge script script/ConfigurePeers.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast");
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