// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SovaBTC.sol";
import "../src/TokenWrapper.sol";
import "./mocks/MockBTCPrecompile.sol";
import "./mocks/MockERC20BTC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title State Consistency During Failures Tests
/// @notice Comprehensive testing of state consistency when operations fail
contract StateConsistencyTest is Test {
    SovaBTC public sovaBTC;
    TokenWrapper public wrapper;
    MockBTCPrecompile public mockPrecompile;
    MockERC20BTC public token;
    
    address public owner = makeAddr("owner");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    
    function setUp() public {
        // Deploy mock precompile
        mockPrecompile = new MockBTCPrecompile();
        mockPrecompile.reset();
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
        
        // Set up test token
        token = new MockERC20BTC("Test Token", "TEST", 8);
        wrapper.addAllowedToken(address(token));
        
        vm.stopPrank();
    }
}
